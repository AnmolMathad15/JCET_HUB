import { io, Socket } from "socket.io-client";
import { getAuthToken, getUser } from "./auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    path: `${BASE}/socket.io`,
    auth: { token: getAuthToken() },
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
