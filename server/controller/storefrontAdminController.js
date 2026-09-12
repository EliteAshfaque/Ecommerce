import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import { emitAdminChange } from "../realtime/socket.js";

const resources = {
  categories: { table: "storefront_categories", columns: ["name", "slug", "description", "image_url", "sort_order", "is_active"] },
  banners: { table: "storefront_banners", columns: ["eyebrow", "title", "description", "image_url", "cta_label", "cta_url", "sort_order", "is_active", "starts_at", "ends_at"] },
  offers: { table: "storefront_offers", columns: ["kicker", "title", "description", "promotion_code", "cta_label", "cta_url", "accent", "sort_order", "is_active"] },
  news: { table: "storefront_news", columns: ["kicker", "title", "description", "image_url", "cta_label", "cta_url", "sort_order", "is_active", "published_at"] },
};
const resourceFor = (name, next) => resources[name] || next(new ErrorHandler("Unknown storefront resource.", 404));
const valuesFor = (resource, body) => resource.columns.map((key) => body[key] ?? (key === "is_active" ? true : key === "sort_order" ? 0 : null));

export const getAdminStorefront = catchAsyncErrors(async (req, res, next) => {
  const resource = resourceFor(req.params.resource, next); if (!resource) return;
  const { rows } = await database.query(`SELECT * FROM ${resource.table} ORDER BY sort_order, created_at DESC`);
  res.json({ success: true, items: rows });
});
export const createAdminStorefront = catchAsyncErrors(async (req, res, next) => {
  const resource = resourceFor(req.params.resource, next); if (!resource) return;
  const values = valuesFor(resource, req.body); const placeholders = resource.columns.map((_, index) => `$${index + 1}`).join(",");
  const { rows } = await database.query(`INSERT INTO ${resource.table} (${resource.columns.join(",")}) VALUES (${placeholders}) RETURNING *`, values);
  emitAdminChange("storefront", "created"); res.status(201).json({ success: true, message: "Storefront content created.", item: rows[0] });
});
export const updateAdminStorefront = catchAsyncErrors(async (req, res, next) => {
  const resource = resourceFor(req.params.resource, next); if (!resource) return;
  const values = valuesFor(resource, req.body); const set = resource.columns.map((key, index) => `${key}=$${index + 1}`).join(",");
  const { rows } = await database.query(`UPDATE ${resource.table} SET ${set} WHERE id=$${values.length + 1} RETURNING *`, [...values, req.params.id]);
  if (!rows[0]) return next(new ErrorHandler("Storefront item not found.", 404));
  emitAdminChange("storefront", "updated"); res.json({ success: true, message: "Storefront content updated.", item: rows[0] });
});
export const deleteAdminStorefront = catchAsyncErrors(async (req, res, next) => {
  const resource = resourceFor(req.params.resource, next); if (!resource) return;
  const { rows } = await database.query(`DELETE FROM ${resource.table} WHERE id=$1 RETURNING id`, [req.params.id]);
  if (!rows[0]) return next(new ErrorHandler("Storefront item not found.", 404));
  emitAdminChange("storefront", "deleted"); res.json({ success: true, message: "Storefront content deleted." });
});
