import "./config/loadEnv.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middlewares/errorMiddlesware.js"; 
import authRoutes from "./router/authRoutes.js"; 
import productRoutes from "./router/productRoutes.js";
import adminRoutes from "./router/adminRoutes.js"; 
import { stripeWebhook } from "./controller/paymentcontroller.js";
import orderRoutes from "./router/orderRoutes.js"; 
import wishlistRoutes from "./router/wishlistRoutes.js";
import promotionRoutes from "./router/promotionRoutes.js";
const app = express();


app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Stripe signs the exact raw request body, so this endpoint must be registered
// before Express parses JSON for the rest of the API.
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(
  fileUpload({
    tempFileDir: "./uploads",
    useTempFiles: true,
    // Keep uploads bounded before they reach Cloudinary or local disk.
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
  })
);
// Lightweight readiness endpoint used by hosting and uptime checks.
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/promotion", promotionRoutes);
// Error middleware must be last so it receives errors from every route.
app.use(errorMiddleware);

export default app;
