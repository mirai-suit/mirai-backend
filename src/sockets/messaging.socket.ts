import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";

/**
 * Handle messaging-related Socket.IO events
 * This keeps the server.ts clean and groups related functionality
 */
export const handleMessagingEvents = (io: SocketIOServer, socket: Socket) => {
  // Join a board room for messaging
  socket.on("joinBoard", (boardId: string) => {
    socket.join(`board_${boardId}`);
    logger.info(`User ${socket.id} joined board ${boardId}`);

    // Notify others that user joined
    socket.to(`board_${boardId}`).emit("userJoined", {
      socketId: socket.id,
      boardId,
    });
  });

  // Leave a board room
  socket.on("leaveBoard", (boardId: string) => {
    socket.leave(`board_${boardId}`);
    logger.info(`User ${socket.id} left board ${boardId}`);

    // Notify others that user left
    socket.to(`board_${boardId}`).emit("userLeft", {
      socketId: socket.id,
      boardId,
    });
  });

  // Handle typing indicators
  socket.on(
    "typing",
    (data: {
      boardId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      const { boardId, userId, userName, isTyping } = data;
      socket.to(`board_${boardId}`).emit("userTyping", {
        userId,
        userName,
        isTyping,
        socketId: socket.id,
      });
    }
  );

  // Handle sending a message (for real-time broadcast only)
  // The actual message saving is handled by the REST API
  socket.on("sendMessage", (data: { boardId: string; message: any }) => {
    // Broadcast to all users in the board room
    io.to(`board_${data.boardId}`).emit("receiveMessage", data.message);
  });

  // Handle message editing broadcast
  socket.on(
    "editMessage",
    (data: {
      boardId: string;
      messageId: string;
      text: string;
      editedAt: string;
    }) => {
      socket.to(`board_${data.boardId}`).emit("messageEdited", data);
    }
  );

  // Handle message deletion broadcast
  socket.on(
    "deleteMessage",
    (data: { boardId: string; messageId: string; deletedAt: string }) => {
      socket.to(`board_${data.boardId}`).emit("messageDeleted", data);
    }
  );

  // Handle user presence/status updates
  socket.on(
    "updatePresence",
    (data: {
      boardId: string;
      userId: string;
      status: "online" | "away" | "offline";
    }) => {
      socket.to(`board_${data.boardId}`).emit("userPresenceChanged", {
        userId: data.userId,
        status: data.status,
        socketId: socket.id,
      });
    }
  );
};

/**
 * Handle user disconnection cleanup for messaging
 */
export const handleMessagingDisconnect = (socket: Socket) => {
  logger.info(`User disconnected: ${socket.id}`);

  // Notify all board rooms this user was in that they disconnected
  const rooms = Array.from(socket.rooms);
  rooms.forEach((room) => {
    if (room.startsWith("board_")) {
      socket.to(room).emit("userLeft", {
        socketId: socket.id,
        boardId: room.replace("board_", ""),
      });
    }
  });
};
