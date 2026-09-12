import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import { emitAdminChange } from "../realtime/socket.js";

const editableFields = [
  "code", "name", "description", "discount_type", "discount_value",
  "min_order_amount", "max_discount_amount", "starts_at", "ends_at", "is_active",
];

const normalizePromotion = (body) => ({
  ...body,
  code: body.code?.trim().toUpperCase(),
  name: body.name?.trim(),
  discount_value: Number(body.discount_value),
  min_order_amount: Number(body.min_order_amount || 0),
  max_discount_amount: body.max_discount_amount ? Number(body.max_discount_amount) : null,
  is_active: body.is_active !== false && body.is_active !== "false",
});

const validatePromotion = (promotion, next) => {
  if (!promotion.code || !promotion.name || !["Percent", "Fixed"].includes(promotion.discount_type)) {
    next(new ErrorHandler("Provide a code, name, and valid discount type.", 400));
    return false;
  }
  if (!Number.isFinite(promotion.discount_value) || promotion.discount_value <= 0 ||
      (promotion.discount_type === "Percent" && promotion.discount_value > 100)) {
    next(new ErrorHandler("Provide a valid discount value.", 400));
    return false;
  }
  return true;
};

export const getActivePromotions = catchAsyncErrors(async (_req, res) => {
  const { rows } = await database.query(
    `SELECT id, code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, ends_at
     FROM promotions
     WHERE is_active = TRUE AND starts_at <= CURRENT_TIMESTAMP
       AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
     ORDER BY created_at DESC`
  );
  res.status(200).json({ success: true, promotions: rows });
});

export const getAllPromotions = catchAsyncErrors(async (_req, res) => {
  const { rows } = await database.query("SELECT * FROM promotions ORDER BY created_at DESC");
  res.status(200).json({ success: true, promotions: rows });
});

export const createPromotion = catchAsyncErrors(async (req, res, next) => {
  const promotion = normalizePromotion(req.body);
  if (!validatePromotion(promotion, next)) return;
  const { rows } = await database.query(
    `INSERT INTO promotions (code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8, CURRENT_TIMESTAMP),$9,$10) RETURNING *`,
    [promotion.code, promotion.name, promotion.description || null, promotion.discount_type, promotion.discount_value, promotion.min_order_amount, promotion.max_discount_amount, promotion.starts_at || null, promotion.ends_at || null, promotion.is_active]
  );
  emitAdminChange("promotions", "created");
  res.status(201).json({ success: true, message: "Sale created.", promotion: rows[0] });
});

export const updatePromotion = catchAsyncErrors(async (req, res, next) => {
  const current = await database.query("SELECT * FROM promotions WHERE id = $1", [req.params.id]);
  if (!current.rows[0]) return next(new ErrorHandler("Sale not found.", 404));
  const promotion = normalizePromotion({ ...current.rows[0], ...req.body });
  if (!validatePromotion(promotion, next)) return;
  const values = editableFields.map((field) => promotion[field]);
  const { rows } = await database.query(
    `UPDATE promotions SET code=$1, name=$2, description=$3, discount_type=$4, discount_value=$5,
      min_order_amount=$6, max_discount_amount=$7, starts_at=$8, ends_at=$9, is_active=$10
     WHERE id=$11 RETURNING *`,
    [...values, req.params.id]
  );
  emitAdminChange("promotions", "updated");
  res.status(200).json({ success: true, message: "Sale updated.", promotion: rows[0] });
});

export const deletePromotion = catchAsyncErrors(async (req, res, next) => {
  const { rows } = await database.query("DELETE FROM promotions WHERE id = $1 RETURNING id", [req.params.id]);
  if (!rows[0]) return next(new ErrorHandler("Sale not found.", 404));
  emitAdminChange("promotions", "deleted");
  res.status(200).json({ success: true, message: "Sale removed.", id: req.params.id });
});
