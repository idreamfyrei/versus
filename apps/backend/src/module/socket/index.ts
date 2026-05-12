import { SocketService } from './socket.service';

export const initSocket = (server: any) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  const socketService = new SocketService(io);

  io.on("connection", (socket: any) => {
    console.log("New client connected:", socket.id);

    socketService.handleConnection(socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      socketService.handleDisconnection(socket);
    });
  });
};