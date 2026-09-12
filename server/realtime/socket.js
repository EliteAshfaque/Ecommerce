import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import database from "../database/db.js";

let io;

const allowedOrigins = () =>
  [process.env.FRONTEND_URL, process.env.DASHBOARD_URL].filter(Boolean);

const isAllowedSocketOrigin = (origin) =>
  allowedOrigins().includes(origin) || (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):517[3-9]$/.test(origin || ""));

const readCookie = (cookieHeader, name) => {
  const cookie = String(cookieHeader || "")
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
};

export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        // Requests without an Origin are allowed for local health tooling.
        if (!origin || isAllowedSocketOrigin(origin)) return callback(null, true);
        return callback(new Error("Socket origin is not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Cookie authentication mirrors the HTTP API. Anonymous visitors may receive
  // public catalogue events, but never user or administrator room events.
  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, "token");
      if (!token) return next();

      const { id } = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const { rows } = await database.query(
        "SELECT id, role FROM users WHERE id = $1 LIMIT 1",
        [id]
      );
      if (rows[0]) socket.data.user = rows[0];
      return next();
    } catch {
      // An expired socket cookie behaves as an anonymous visitor; HTTP calls
      // still return their usual authentication error.
      return next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user) socket.join(`user:${user.id}`);
    if (user?.role === "Admin") socket.join("admins");
  });

  return io;
};

export const emitCatalogueChange = (action, productId = null) => {
  io?.emit("catalogue:changed", { action, productId, at: Date.now() });
  io?.to("admins").emit("admin:changed", { resource: "catalogue", action });
};

// Every order event includes fulfilment plus financial state. Consumers still refetch
// the authoritative record, but the payload is useful for immediate UI feedback.
export const emitOrderChange = (order, action, financialState = {}) => {
  const payload = {
    action,
    orderId: order.id,
    status: order.order_status,
    paymentStatus: financialState.paymentStatus || order.payment_status || null,
    refundStatus: financialState.refundStatus || order.refund_status || null,
    at: Date.now(),
  };
  io?.to(`user:${order.buyer_id}`).emit("order:changed", payload);
  io?.to("admins").emit("order:changed", payload);
  io?.to("admins").emit("admin:changed", { resource: "dashboard", action });
};

export const emitAdminChange = (resource, action) => {
  io?.to("admins").emit("admin:changed", { resource, action, at: Date.now() });
};

// CMS changes are public storefront content, so active shoppers refresh without reloading.
export const emitStorefrontChange = (action) => {
  io?.emit("storefront:changed", { action, at: Date.now() });
  io?.to("admins").emit("admin:changed", { resource: "storefront", action, at: Date.now() });
};
