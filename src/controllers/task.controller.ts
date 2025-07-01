// Reorder tasks in a column
import { reorderTasksSchema } from "../schemas/task.schema";

export const reorderTasksInColumn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate column ID param
    const { columnId } = columnIdParamSchema.parse(req.params);
    // Validate body
    const { taskIds } = reorderTasksSchema.parse(req.body);
    const result = await taskService.reorderTasksInColumn(columnId, taskIds);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Reorder Tasks Controller Error: ${error}`);
    next(error);
  }
};
import { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import * as taskAttachmentService from "../services/taskAttachment.service";
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
    // Transform form data values for proper validation
    const transformedBody = {
      ...req.body,
      // Convert string numbers to actual numbers
      order: req.body.order ? parseInt(req.body.order, 10) : undefined,
      // Convert string booleans to actual booleans
      isRecurring: req.body.isRecurring === "true",
      // Handle empty teamId (convert empty string to undefined)
      teamId:
        req.body.teamId && req.body.teamId.trim() !== ""
          ? req.body.teamId
          : undefined,
      // Handle assigneeIds array (they come as separate form fields with same name)
      assigneeIds: req.body.assigneeIds
        ? Array.isArray(req.body.assigneeIds)
          ? req.body.assigneeIds
          : [req.body.assigneeIds]
        : [],
    };

    // Validate request body
    const validatedData = createTaskSchema.parse(transformedBody);

    // Get the current user ID from the request (assuming it's set by auth middleware)
    const assignerId = (req as any).user?.id;

    // Create the task first
    const result = await taskService.createTask(validatedData, assignerId);

    // Handle file attachments if any
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      try {
        const attachmentData = {
          taskId: result.task.id,
          uploaderId: assignerId,
          files: req.files as Express.Multer.File[],
        };

        const attachments = await taskAttachmentService.createTaskAttachments(
          attachmentData
        );

        // Add attachments to the task response
        result.task = {
          ...result.task,
          attachments: attachments,
        } as any; // Type assertion since we're extending the interface

        logger.info(
          `Created task ${result.task.id} with ${attachments.length} attachments`
        );
      } catch (attachmentError) {
        logger.error(
          `Failed to upload attachments for task ${result.task.id}: ${attachmentError}`
        );
        // Task is already created, so we don't fail the entire request
        // Just log the error and continue
      }
    }

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

// Get attachments for a task
export const getTaskAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const attachments = await taskAttachmentService.getTaskAttachments(
      taskId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Task attachments retrieved successfully",
      data: attachments,
    });
  } catch (error) {
    logger.error(`Get task attachments error: ${error}`);
    next(error);
  }
};

// Delete an attachment from a task
export const deleteTaskAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attachmentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    await taskAttachmentService.deleteTaskAttachment(attachmentId, userId);

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete task attachment error: ${error}`);
    next(error);
  }
};
