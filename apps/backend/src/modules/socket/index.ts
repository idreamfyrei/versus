import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "./../../common/config/env.js";

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join:poll", ({ pollId }: { pollId: string }) => {
      socket.join(`vs:${pollId}`);
    });

    socket.on("leave:poll", ({ pollId }: { pollId: string }) => {
      socket.leave(`vs:${pollId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
