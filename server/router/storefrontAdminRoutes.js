import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/authmiddleware.js";
import { createAdminStorefront, deleteAdminStorefront, getAdminStorefront, updateAdminStorefront } from "../controller/storefrontAdminController.js";
const router = express.Router();
router.use(isAuthenticated, authorizeRoles("Admin"));
router.route("/:resource").get(getAdminStorefront).post(createAdminStorefront);
router.route("/:resource/:id").put(updateAdminStorefront).delete(deleteAdminStorefront);
export default router;
