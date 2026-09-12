import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/authmiddleware.js";
import { createPromotion, deletePromotion, getActivePromotions, getAllPromotions, updatePromotion } from "../controller/promotionController.js";

const router = express.Router();
router.get("/active", getActivePromotions);
router.get("/admin", isAuthenticated, authorizeRoles("Admin"), getAllPromotions);
router.post("/admin", isAuthenticated, authorizeRoles("Admin"), createPromotion);
router.put("/admin/:id", isAuthenticated, authorizeRoles("Admin"), updatePromotion);
router.delete("/admin/:id", isAuthenticated, authorizeRoles("Admin"), deletePromotion);
export default router;
