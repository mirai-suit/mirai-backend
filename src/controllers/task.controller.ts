import { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import logger from "src/utils/logger";

// Create a new task
// task.controller.ts (update createTask)
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      status,
      dueDate,
      priority,
      order,
      isRecurring,
      boardId,
      columnId,
      teamId,
      assigneeIds,
    } = req.body;

    if (!title || !status || !boardId || !columnId) {
      res.status(400).json({ success: false, message: 'title, status, boardId, and columnId are required' });
      return;
    }

    const result = await taskService.createTask({
      title,
      description,
      status,
      dueDate,
      priority,
      order,
      isRecurring,
      boardId,
      columnId,
      teamId,
      assigneeIds,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Task Controller Error: ${error}`);
    next(error);
  }
};

// Get a task by ID
export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }
    const result = await taskService.getTaskById(taskId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Task Controller Error: ${error}`);
    next(error);
  }
};

// Get all tasks for a board
export const getTasksForBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }
    const result = await taskService.getTasksForBoard(boardId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Tasks For Board Controller Error: ${error}`);
    next(error);
  }
};

// Get all tasks for a column
export const getTasksForColumn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const columnId = req.params.columnId || req.body.columnId;
    if (!columnId) {
      res.status(400).json({ success: false, message: "columnId is required" });
      return;
    }
    const result = await taskService.getTasksForColumn(columnId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Tasks For Column Controller Error: ${error}`);
    next(error);
  }
};

// Update a task
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId, ...updateData } = req.body;
    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }
    const result = await taskService.updateTask(taskId, updateData);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Task Controller Error: ${error}`);
    next(error);
  }
};

// Soft delete a task
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    if (!taskId) {
      res.status(400).json({ success: false, message: "taskId is required" });
      return;
    }
    const result = await taskService.deleteTask(taskId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Task Controller Error: ${error}`);
    next(error);
  }
};

// Assign users to a task
export const assignUsersToTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, userIds } = req.body;
    if (!taskId || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ success: false, message: 'taskId and a non-empty userIds array are required' });
      return;
    }
    const result = await taskService.assignUsersToTask(taskId, userIds);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Assign Users To Task Controller Error: ${error}`);
    next(error);
  }
};

