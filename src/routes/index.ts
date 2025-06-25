import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import organizationRoutes from "./organization.routes";
import invitationRoutes from "./invitation.routes";
import taskRoutes from "./task.routes";
import boardRoutes from "./board.routes";
import messagingRoutes from "./messaging.routes";
import columnRoutes from "./column.routes"; // Assuming you have a column.routes.ts file

const router = Router();

// Health check for API routes
router.get("/", (_req, res) => {
  res.status(200).json({ message: "API is running" });
});

// Register all route modules
router.use("/auth", authRoutes);
router.use("/user", userRoutes); // Assuming user routes are also in auth.routes.ts
router.use("/task", taskRoutes);
router.use("/board", boardRoutes);
router.use("/column", columnRoutes); // Assuming you have a column.routes.ts file
router.use("/organization", organizationRoutes);
router.use("/invitation", invitationRoutes); // Public invitation endpoints
router.use("/chats/:boardId/messages", messagingRoutes); // Private invitation endpoints

export default router;
