import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/authmiddleware.js";
import { getSupportMessages, updateSupportMessage } from "../controller/supportController.js";

const router = express.Router();

// All support content includes customer contact details, so it is Admin-only.
router.use(isAuthenticated, authorizeRoles("Admin"));
router.get("/messages", getSupportMessages);
router.put("/messages/:id", updateSupportMessage);

export default router;
