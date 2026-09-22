import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "";
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (apiUrl ? apiUrl.replace(/\/api\/v1\/?$/, "") : undefined);

export const realtimeSocket = io(socketUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});
