import database from "../database/db.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { emitAdminChange, emitOrderChange } from "../realtime/socket.js";

const reasons = ["Changed my mind", "Damaged or defective", "Wrong item received", "Not as described", "Other"];
const adminStatuses = ["Requested", "Approved", "Rejected", "Received", "Refunded", "Cancelled"];

const requestSelect = `
  SELECT rr.*, u.name AS customer_name, u.email AS customer_email,
    o.total_price, o.order_status, p.payment_status,
    COALESCE(json_agg(json_build_object(
      'id', ri.id, 'order_item_id', ri.order_item_id, 'product_id', ri.product_id,
      'quantity', ri.quantity, 'title', oi.title, 'image', oi.image, 'price', oi.price
    )) FILTER (WHERE ri.id IS NOT NULL), '[]') AS items
  FROM return_requests rr
  JOIN users u ON u.id = rr.buyer_id
  JOIN orders o ON o.id = rr.order_id
  LEFT JOIN payments p ON p.order_id = o.id
  LEFT JOIN return_items ri ON ri.return_request_id = rr.id
  LEFT JOIN order_items oi ON oi.id = ri.order_item_id
`;

// Customers may return only a paid, delivered item. Quantities are checked
// against prior active return requests to prevent returning an item twice.
export const createReturnRequest = catchAsyncErrors(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason, customer_note: customerNote = "", items } = req.body;
  if (!reasons.includes(reason)) return next(new ErrorHandler("Choose a valid return reason.", 400));
  if (!Array.isArray(items) || !items.length) return next(new ErrorHandler("Select at least one item to return.", 400));

  const orderResult = await database.query(
    `SELECT o.id FROM orders o JOIN payments p ON p.order_id = o.id
      WHERE o.id = $1 AND o.buyer_id = $2 AND o.order_status = 'Delivered' AND p.payment_status = 'Paid'`,
    [orderId, req.user.id]
  );
  if (!orderResult.rows[0]) return next(new ErrorHandler("Only delivered, paid orders can be returned.", 409));

  const requested = new Map();
  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!item?.order_item_id || !Number.isInteger(quantity) || quantity < 1) {
      return next(new ErrorHandler("Every return item needs a valid quantity.", 400));
    }
    requested.set(item.order_item_id, (requested.get(item.order_item_id) || 0) + quantity);
  }

  const itemIds = [...requested.keys()];
  const { rows: purchased } = await database.query(
    `SELECT oi.id, oi.product_id, oi.quantity,
       COALESCE(SUM(ri.quantity) FILTER (WHERE rr.status NOT IN ('Rejected', 'Cancelled')), 0)::int AS already_requested
      FROM order_items oi
      LEFT JOIN return_items ri ON ri.order_item_id = oi.id
      LEFT JOIN return_requests rr ON rr.id = ri.return_request_id
      WHERE oi.order_id = $1 AND oi.id = ANY($2::uuid[])
      GROUP BY oi.id`,
    [orderId, itemIds]
  );
  if (purchased.length !== itemIds.length) return next(new ErrorHandler("One or more selected items do not belong to this order.", 400));
  for (const item of purchased) {
    if (requested.get(item.id) + item.already_requested > item.quantity) {
      return next(new ErrorHandler("Return quantity is greater than the available purchased quantity.", 409));
    }
  }

  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO return_requests (order_id, buyer_id, reason, customer_note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [orderId, req.user.id, reason, String(customerNote).trim().slice(0, 1500)]
    );
    await Promise.all(purchased.map((item) => client.query(
      `INSERT INTO return_items (return_request_id, order_item_id, product_id, quantity)
       VALUES ($1, $2, $3, $4)`,
      [rows[0].id, item.id, item.product_id, requested.get(item.id)]
    )));
    await client.query("COMMIT");
    emitAdminChange("returns", "requested");
    res.status(201).json({ success: true, message: "Return request submitted for review.", returnRequest: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

export const getMyReturns = catchAsyncErrors(async (req, res) => {
  const { rows } = await database.query(
    `${requestSelect} WHERE rr.buyer_id = $1
       GROUP BY rr.id, u.id, o.id, p.id ORDER BY rr.requested_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, returns: rows });
});

export const getAdminReturns = catchAsyncErrors(async (_req, res) => {
  const { rows } = await database.query(
    `${requestSelect} GROUP BY rr.id, u.id, o.id, p.id ORDER BY
       CASE rr.status WHEN 'Requested' THEN 0 WHEN 'Approved' THEN 1 WHEN 'Received' THEN 2 ELSE 3 END,
       rr.requested_at DESC`
  );
  res.status(200).json({ success: true, returns: rows });
});

// Status is operational only. A Stripe refund is intentionally not created here:
// partial refund amounts require a finance decision after the return is received.
export const updateReturnRequest = catchAsyncErrors(async (req, res, next) => {
  const { status, admin_note: adminNote = "" } = req.body;
  if (!adminStatuses.includes(status)) return next(new ErrorHandler("Choose a valid return status.", 400));
  const { rows } = await database.query(
    `UPDATE return_requests SET status = $1, admin_note = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *`,
    [status, String(adminNote).trim().slice(0, 1500), req.params.id]
  );
  if (!rows[0]) return next(new ErrorHandler("Return request not found.", 404));
  emitAdminChange("returns", "updated");
  emitOrderChange({ id: rows[0].order_id, buyer_id: rows[0].buyer_id }, "return-updated", { returnStatus: status });
  res.status(200).json({ success: true, message: "Return request updated.", returnRequest: rows[0] });
});
