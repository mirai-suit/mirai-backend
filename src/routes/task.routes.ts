import { Router } from "express";
import * as taskController from "../controllers/task.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Create a new task
router.post("/", verifyToken, taskController.createTask);

// Get a task by ID
router.get("/:taskId", verifyToken, taskController.getTaskById);

// Get all tasks for a board
router.get("/board/:boardId", verifyToken, taskController.getTasksForBoard);

// Get all tasks for a column
router.get("/column/:columnId", verifyToken, taskController.getTasksForColumn);

// Update a task
router.put("/:taskId", verifyToken, taskController.updateTask);

// Move a task between columns (for drag & drop)
router.patch("/:taskId/move", verifyToken, taskController.moveTask);

// Assign users to a task
router.patch("/:taskId/assign", verifyToken, taskController.assignUsersToTask);

// Soft delete a task
router.delete("/:taskId", verifyToken, taskController.deleteTask);

export default router;
