import { Router } from "express";
import * as taskController from "../controllers/task.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  uploadTaskAttachments,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

// Create a new task (with optional file attachments)
router.post(
  "/",
  verifyToken,
  uploadTaskAttachments.array("attachments", 10), // Allow up to 10 files
  handleMulterError,
  taskController.createTask
);

// Get a task by ID (includes attachments)
router.get("/:taskId", verifyToken, taskController.getTaskById);

// Get all tasks for a board
router.get("/board/:boardId", verifyToken, taskController.getTasksForBoard);

// Get attachments for a specific task
router.get(
  "/:taskId/attachments",
  verifyToken,
  taskController.getTaskAttachments
);

// Delete an attachment from a task
router.delete(
  "/:taskId/attachments/:attachmentId",
  verifyToken,
  taskController.deleteTaskAttachment
);

// Get all tasks for a column
router.get("/column/:columnId", verifyToken, taskController.getTasksForColumn);

// Update a task
router.put("/:taskId", verifyToken, taskController.updateTask);

// Move a task between columns (for drag & drop)
router.patch("/:taskId/move", verifyToken, taskController.moveTask);

// Reorder tasks within a column
router.patch(
  "/column/:columnId/reorder",
  verifyToken,
  taskController.reorderTasksInColumn
);

// Assign users to a task
router.patch("/:taskId/assign", verifyToken, taskController.assignUsersToTask);

// Soft delete a task
router.delete("/:taskId", verifyToken, taskController.deleteTask);

export default router;
