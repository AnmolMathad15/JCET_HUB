import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./lib/logger";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("join-room", (userId: string) => {
      socket.join(`user-${userId}`);
      logger.info({ userId, socketId: socket.id }, "User joined room");
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  io?.to(`user-${userId}`).emit(event, data);
}

export function broadcastNotification(notification: unknown) {
  io?.emit("notification", notification);
}
