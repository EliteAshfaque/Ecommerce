import express from "express";
import {
  placeNewOrder,
  fetchSingleOrder,
  fetchMyOrders,
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controller/orderController.js";
import {
  isAuthenticated,
  authorizeRoles,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// USER ROUTES
router.post("/new", isAuthenticated, placeNewOrder);
router.get("/orders/me", isAuthenticated, fetchMyOrders);
router.get("/:orderId", isAuthenticated, fetchSingleOrder);

// ADMIN ROUTES
router.get(
  "/admin/getall",
  isAuthenticated,
  authorizeRoles("Admin"),
  fetchAllOrders
);

router.put(
  "/admin/update/:orderId",
  isAuthenticated,
  authorizeRoles("Admin"),
  updateOrderStatus
);

router.delete(
  "/admin/delete/:orderId",
  isAuthenticated,
  authorizeRoles("Admin"),
  deleteOrder
);

export default router;
