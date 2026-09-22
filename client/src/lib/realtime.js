import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
// A separate VITE_SOCKET_URL is optional for deployments that proxy sockets.
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/v1\/?$/, "");

// One reusable Socket.IO client. LiveUpdates decides when to connect and which
// incoming events should trigger a Redux/API refresh.
export const realtimeSocket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});
