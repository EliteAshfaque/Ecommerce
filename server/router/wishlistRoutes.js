import express from "express";
import { isAuthenticated } from "../middlewares/authmiddleware.js";
import { addWishlistItem, getWishlist, removeWishlistItem } from "../controller/wishlistController.js";

const router = express.Router();
router.get("/", isAuthenticated, getWishlist);
router.post("/:productId", isAuthenticated, addWishlistItem);
router.delete("/:productId", isAuthenticated, removeWishlistItem);
export default router;
