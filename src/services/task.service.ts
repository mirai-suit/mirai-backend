import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

// Create a new task
export const createTask = async (data: {
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  priority?: number;
  order?: number;
  isRecurring?: boolean;
  boardId: string;
  columnId: string;
  teamId?: string;
  assigneeIds?: string[];
}) => {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        dueDate: data.dueDate,
        priority: data.priority,
        order: data.order,
        isRecurring: data.isRecurring ?? false,
        boardId: data.boardId,
        columnId: data.columnId,
        teamId: data.teamId,
        assignees: data.assigneeIds
          ? { connect: data.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { assignees: true, column: true },
    });
    return { success: true, task };
  } catch (error) {
    logger.error(`Error Creating Task: ${error}`);
    throw new CustomError(500, "Failed to create task");
  }
};

// Get a task by ID
export const getTaskById = async (taskId: string) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true, board: true, team: true, column: true },
    });
    if (!task) throw new CustomError(404, "Task not found");
    return { success: true, task };
  } catch (error) {
    logger.error(`Error Fetching Task: ${error}`);
    throw new CustomError(500, "Failed to fetch task");
  }
};

// Get all tasks for a board
export const getTasksForBoard = async (boardId: string) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { boardId, deletedAt: null },
      include: { assignees: true, team: true, column: true },
    });
    return { success: true, tasks };
  } catch (error) {
    logger.error(`Error Fetching Tasks: ${error}`);
    throw new CustomError(500, "Failed to fetch tasks");
  }
};

// Get all tasks for a column
export const getTasksForColumn = async (columnId: string) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { columnId, deletedAt: null },
      include: { assignees: true, team: true, board: true },
    });
    return { success: true, tasks };
  } catch (error) {
    logger.error(`Error Fetching Tasks for Column: ${error}`);
    throw new CustomError(500, "Failed to fetch tasks for column");
  }
};

// Update a task
export const updateTask = async (
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: Date;
    priority?: number;
    order?: number;
    isRecurring?: boolean;
    teamId?: string;
    columnId?: string;
    assigneeIds?: string[];
  }
) => {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...data,
        assignees: data.assigneeIds
          ? { set: data.assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { assignees: true, column: true },
    });
    return { success: true, task: updated };
  } catch (error) {
    logger.error(`Error Updating Task: ${error}`);
    throw new CustomError(500, "Failed to update task");
  }
};

// Soft delete a task
export const deleteTask = async (taskId: string) => {
  try {
    const deleted = await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
    return { success: true, task: deleted };
  } catch (error) {
    logger.error(`Error Deleting Task: ${error}`);
    throw new CustomError(500, "Failed to delete task");
  }
};

// Assign users to a task
export const assignUsersToTask = async (taskId: string, userIds: string[]) => {
  try {
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: { set: userIds.map((id) => ({ id })) },
      },
      include: { assignees: true },
    });
    return { success: true, task: updated };
  } catch (error) {
    logger.error(`Error Assigning Users: ${error}`);
    throw new CustomError(500, "Failed to assign users to task");
  }
};