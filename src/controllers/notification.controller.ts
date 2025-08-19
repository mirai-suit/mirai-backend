import { Request, Response, NextFunction } from "express";
import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
} from "../services/notification.service";

export const createNotificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, teamId, notification } = req.body;
    const userId = req.user.id; // Authenticated user
    if (!userId) {
      res.status(400).json({ success: false, message: "User is Unauthenticated" });
    }
    const result = await createNotification({ userId, boardId, teamId, notification });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserNotificationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id; // Authenticated user
    if (!userId) {
      res.status(400).json({ success: false, message: "User is Unauthenticated" });
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await getUserNotifications(userId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notificationId = req.params.notificationId;
    const result = await markNotificationAsRead(notificationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};