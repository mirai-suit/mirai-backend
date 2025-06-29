import { Server as SocketIOServer, Socket } from "socket.io";
import {
  handleMessagingEvents,
  handleMessagingDisconnect,
} from "./messaging.socket";
import logger from "../utils/logger";

/**
 * Main Socket.IO event handler
 * Orchestrates all socket events and keeps them organized
 */
export const initializeSocketHandlers = (io: SocketIOServer) => {
  io.on("connection", (socket: Socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Initialize messaging event handlers
    handleMessagingEvents(io, socket);

    // Handle disconnection
    socket.on("disconnect", () => {
      handleMessagingDisconnect(socket);
    });

    // You can add more event handler modules here as the app grows
    // handleTaskEvents(io, socket);
    // handleNotificationEvents(io, socket);
    // handleBoardEvents(io, socket);
  });
};
