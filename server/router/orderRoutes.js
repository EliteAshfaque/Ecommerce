import express from "express";
import {
  placeNewOrder,
  fetchSingleOrder,
  fetchMyOrders,
  fetchAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controller/orderController.js";
import { createReturnRequest, getAdminReturns, getMyReturns, updateReturnRequest } from "../controller/returnController.js";
import {
  isAuthenticated,
  authorizeRoles,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// USER ROUTES
router.post("/new", isAuthenticated, placeNewOrder);
router.get("/orders/me", isAuthenticated, fetchMyOrders);
router.get("/returns/me", isAuthenticated, getMyReturns);
router.post("/:orderId/returns", isAuthenticated, createReturnRequest);
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
router.get("/admin/returns", isAuthenticated, authorizeRoles("Admin"), getAdminReturns);
router.put("/admin/returns/:id", isAuthenticated, authorizeRoles("Admin"), updateReturnRequest);

export default router;
