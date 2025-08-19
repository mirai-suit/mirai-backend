import { Router } from "express";
import {
  createNotificationController,
  getUserNotificationsController,
  markNotificationAsReadController,
} from "../controllers/notification.controller";
import {verifyToken} from "../middlewares/auth.middleware"; // Adjust path as needed

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Create a notification
router.post("/", createNotificationController);

// Get notifications for the authenticated user
router.get("/user/", getUserNotificationsController);

// Mark a notification as read
router.patch("/:notificationId/read", markNotificationAsReadController);

export default router;