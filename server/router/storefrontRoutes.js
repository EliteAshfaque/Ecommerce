import express from "express";
import { createContactMessage, getStorefront, subscribeNewsletter } from "../controller/storefrontController.js";

const router = express.Router();
router.get("/", getStorefront);
router.post("/contact", createContactMessage);
router.post("/newsletter", subscribeNewsletter);
export default router;
