import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";

export const getWishlist = catchAsyncErrors(async (req, res) => {
  const { rows } = await database.query(
    `SELECT p.* FROM wishlist_items w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, products: rows });
});

export const addWishlistItem = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const product = await database.query("SELECT id FROM products WHERE id = $1", [productId]);
  if (!product.rows[0]) return next(new ErrorHandler("Product not found.", 404));

  await database.query(
    "INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING",
    [req.user.id, productId]
  );
  res.status(201).json({ success: true, message: "Saved to favourites.", productId });
});

export const removeWishlistItem = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const result = await database.query(
    "DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2 RETURNING product_id",
    [req.user.id, productId]
  );
  if (!result.rows[0]) return next(new ErrorHandler("Favourite not found.", 404));
  res.status(200).json({ success: true, message: "Removed from favourites.", productId });
});
