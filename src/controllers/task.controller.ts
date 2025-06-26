import { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import logger from "src/utils/logger";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignUsersSchema,
  taskIdParamSchema,
  boardIdParamSchema,
  columnIdParamSchema,
} from "../schemas/task.schema";
import {
  CreateTaskResponseDto,
  GetTaskResponseDto,
  GetTasksResponseDto,
  UpdateTaskResponseDto,
  DeleteTaskResponseDto,
  MoveTaskResponseDto,
  AssignUsersResponseDto,
} from "../interfaces/DTOs/task/response.dto";

// Create a new task
export const createTask = async (
  req: Request,
  res: Response<CreateTaskResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate request body
    const validatedData = createTaskSchema.parse(req.body);

    // Get the current user ID from the request (assuming it's set by auth middleware)
    const assignerId = (req as any).user?.id;

    const result = await taskService.createTask(validatedData, assignerId);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Task Controller Error: ${error}`);
    next(error);
  }
};

// Get a task by ID
export const getTaskById = async (
  req: Request,
  res: Response<GetTaskResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate task ID parameter
    const { taskId } = taskIdParamSchema.parse(req.params);

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
  res: Response<GetTasksResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate board ID parameter
    const { boardId } = boardIdParamSchema.parse(req.params);

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
  res: Response<GetTasksResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate column ID parameter
    const { columnId } = columnIdParamSchema.parse(req.params);

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
  res: Response<UpdateTaskResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate task ID parameter
    const { taskId } = taskIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = updateTaskSchema.parse(req.body);

    const result = await taskService.updateTask(taskId, validatedData);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Task Controller Error: ${error}`);
    next(error);
  }
};

// Move a task between columns (for drag & drop)
export const moveTask = async (
  req: Request,
  res: Response<MoveTaskResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate task ID parameter
    const { taskId } = taskIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = moveTaskSchema.parse(req.body);

    const result = await taskService.moveTask({ ...validatedData, taskId });
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Move Task Controller Error: ${error}`);
    next(error);
  }
};

// Soft delete a task
export const deleteTask = async (
  req: Request,
  res: Response<DeleteTaskResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate task ID parameter
    const { taskId } = taskIdParamSchema.parse(req.params);

    const result = await taskService.deleteTask(taskId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Task Controller Error: ${error}`);
    next(error);
  }
};

// Assign users to a task
export const assignUsersToTask = async (
  req: Request,
  res: Response<AssignUsersResponseDto>,
  next: NextFunction
) => {
  try {
    // Validate task ID parameter
    const { taskId } = taskIdParamSchema.parse(req.params);

    // Validate request body
    const validatedData = assignUsersSchema.parse(req.body);

    const result = await taskService.assignUsersToTask(
      taskId,
      validatedData.userIds
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Assign Users To Task Controller Error: ${error}`);
    next(error);
  }
};
