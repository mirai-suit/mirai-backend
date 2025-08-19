import { Server as SocketIOServer, Socket } from "socket.io";
import logger from "../utils/logger";

/**
 * Handle notification-related Socket.IO events.
 * Users join their own notification room (by userId) to receive real-time notifications.
 */
export const handleNotificationEvents = (io: SocketIOServer, socket: Socket) => {
  // User joins their personal notification room
  socket.on("joinNotifications", (userId: string) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${socket.id} joined notifications for user ${userId}`);
  });

  // User leaves their notification room (optional)
  socket.on("leaveNotifications", (userId: string) => {
    socket.leave(`user_${userId}`);
    logger.info(`User ${socket.id} left notifications for user ${userId}`);
  });

  // (Optional) Join board/team notification rooms for group notifications
  socket.on("joinBoardNotifications", (boardId: string) => {
    socket.join(`board_notify_${boardId}`);
    logger.info(`User ${socket.id} joined board notifications for board ${boardId}`);
  });

  socket.on("leaveBoardNotifications", (boardId: string) => {
    socket.leave(`board_notify_${boardId}`);
    logger.info(`User ${socket.id} left board notifications for board ${boardId}`);
  });

  // (Optional) Join team notification rooms
  socket.on("joinTeamNotifications", (teamId: string) => {
    socket.join(`team_notify_${teamId}`);
    logger.info(`User ${socket.id} joined team notifications for team ${teamId}`);
  });

  socket.on("leaveTeamNotifications", (teamId: string) => {
    socket.leave(`team_notify_${teamId}`);
    logger.info(`User ${socket.id} left team notifications for team ${teamId}`);
  });

   socket.on(
    "dispatchNotification",
    (data: {
      userId?: string;
      boardId?: string;
      teamId?: string;
      notification: any;
    }) => {
      const { userId, boardId, teamId, notification } = data;
      if (userId) {
        io.to(`user_${userId}`).emit("notification:new", notification);
      }
      if (boardId) {
        io.to(`board_notify_${boardId}`).emit("notification:new", notification);
      }
      if (teamId) {
        io.to(`team_notify_${teamId}`).emit("notification:new", notification);
      }
      logger.info(
        `Notification dispatched by ${socket.id} to:${userId ? " user" : ""}${boardId ? " board" : ""}${teamId ? " team" : ""}`
      );
    }
  );
};

/**
 * Handle user disconnection cleanup for notifications.
 * (Optional: You can notify others or perform cleanup here if needed.)
 */
export const handleNotificationDisconnect = (socket: Socket) => {
  logger.info(`User disconnected from notifications: ${socket.id}`);
  // No specific cleanup required for notification rooms by default.
};