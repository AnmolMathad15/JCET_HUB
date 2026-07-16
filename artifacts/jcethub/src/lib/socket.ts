import { io, Socket } from "socket.io-client";
import { getAuthToken, getUser } from "./auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  // Socket.io requires a persistent server — not available in serverless deployments.
  // VITE_SOCKET_URL can point to a dedicated socket server; if absent in production
  // mode, we skip the connection entirely to avoid noisy failed requests.
  const socketUrl: string =
    (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
    window.location.origin;

  if (import.meta.env.PROD && !import.meta.env.VITE_SOCKET_URL) {
    // Serverless production — real-time features gracefully unavailable.
    return null;
  }

  if (socket?.connected) return socket;

  socket = io(socketUrl, {
    path: `${BASE}/api/socket.io`,
    auth: { token: getAuthToken() },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    const user = getUser();
    if (user?.id) socket?.emit("join-room", user.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connection error:", err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
