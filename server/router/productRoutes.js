import express from "express";
import {
  createProduct,
  fetchAllProducts,
  updateProduct,
  deleteProduct,
  fetchSingleProduct,
  postProductReview,
  deleteReview,
  fetchAIFilteredProducts,
} from "../controller/productController.js";
import {
  authorizeRoles,
  isAuthenticated,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin Routes (Require Authentication and 'Admin' Role)
router.post(
  "/admin/create",
  isAuthenticated,
  authorizeRoles("Admin"),
  createProduct,
);

router.put(
  "/admin/update/:productId",
  isAuthenticated,
  authorizeRoles("Admin"),
  updateProduct,
);

router.delete(
  "/admin/delete/:productId",
  isAuthenticated,
  authorizeRoles("Admin"),
  deleteProduct,
);

// // Public Routes (No Authentication Required)
router.get("/", fetchAllProducts);
router.get("/singleProduct/:productId", fetchSingleProduct);

// // User Routes (Require Authentication)
router.put("/post-new/review/:productId", isAuthenticated, postProductReview);
router.delete("/delete/review/:productId", isAuthenticated, deleteReview);

// AI Feature (Requires Authentication)
router.post("/ai-search", isAuthenticated, fetchAIFilteredProducts);

export default router;
 