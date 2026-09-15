import database from "../database/db.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { emitAdminChange } from "../realtime/socket.js";

const inboxStatuses = ["New", "Open", "Resolved", "Closed"];

// The contact form already writes into contact_messages. This endpoint gives
// administrators a safe inbox without exposing it through the public API.
export const getSupportMessages = catchAsyncErrors(async (_req, res) => {
  const { rows } = await database.query(
    `SELECT id, name, email, subject, message, status, admin_reply,
            created_at, replied_at, resolved_at
       FROM contact_messages
      ORDER BY CASE status WHEN 'New' THEN 0 WHEN 'Open' THEN 1 ELSE 2 END,
               created_at DESC`
  );
  res.status(200).json({ success: true, messages: rows });
});

// A reply is recorded in the ticket even when outbound email is not configured.
// This keeps the support history accurate and lets SMTP delivery be added later.
export const updateSupportMessage = catchAsyncErrors(async (req, res, next) => {
  const { status, admin_reply: adminReply } = req.body;
  if (!inboxStatuses.includes(status)) {
    return next(new ErrorHandler("Choose a valid support status.", 400));
  }
  const { rows } = await database.query(
    `UPDATE contact_messages
        SET status = $1,
            admin_reply = $2,
            replied_at = CASE WHEN NULLIF(TRIM($2), '') IS NOT NULL THEN CURRENT_TIMESTAMP ELSE replied_at END,
            resolved_at = CASE WHEN $1 IN ('Resolved', 'Closed') THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, subject, message, status, admin_reply,
                created_at, replied_at, resolved_at`,
    [status, typeof adminReply === "string" ? adminReply.trim() : "", req.params.id]
  );
  if (!rows[0]) return next(new ErrorHandler("Support message not found.", 404));
  emitAdminChange("support", "updated");
  res.status(200).json({ success: true, message: "Support message updated.", supportMessage: rows[0] });
});
