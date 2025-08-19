import prisma from "../config/prisma/prisma.client";
import CustomError from "../shared/exceptions/CustomError";
import logger from "../utils/logger";

export interface CreateNotificationInput {
  userId?: string;
  boardId?: string;
  teamId?: string;
  notification?: any; // Additional payload (taskId, etc.)
}

export const createNotification = async (input: CreateNotificationInput) => {
  try {
    if (!input.userId && !input.boardId && !input.teamId) {
      throw new CustomError(400, "Notification must target a user, board, or team");
    }

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        boardId: input.boardId,
        teamId: input.teamId,
        notification: input.notification ? JSON.stringify(input.notification) : undefined,
        read: false,
      },
    });

    return {
      success: true,
      notification,
    };
  } catch (error) {
    logger.error(`Create Notification Service Error: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to create notification");
  }
};

export const getUserNotifications = async (userId: string, limit = 20, offset = 0) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    return {
      success: true,
      notifications: notifications.map((n) => ({
        ...n,
        notification: n.notification ? JSON.parse(n.notification) : undefined,
      })),
    };
  } catch (error) {
    logger.error(`Get User Notifications Service Error: ${error}`);
    throw new CustomError(500, "Failed to fetch notifications");
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return { success: true, notification };
  } catch (error) {
    logger.error(`Mark Notification Read Service Error: ${error}`);
    throw new CustomError(500, "Failed to mark notification as read");
  }
};