import express from "express";
import { isAuthenticated } from "../middlewares/authmiddleware.js";
import {
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  updatePassword,
  updateProfile,
} from "../controller/authcontroller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.post("/forgot-password", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.put("/update-password", isAuthenticated, updatePassword);
router.put("/update-profile", isAuthenticated, updateProfile);

export default router; 
