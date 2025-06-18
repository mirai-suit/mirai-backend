import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

// Create a new column in a board
export const createColumn = async (name: string, boardId: string) => {
  try {
    const column = await prisma.column.create({
      data: {
        name,
        boardId,
      },
    });
    return { success: true, column };
  } catch (error) {
    logger.error(`Error Creating Column: ${error}`);
    throw new CustomError(500, "Failed to create column");
  }
};

// Get all columns for a board
export const getColumnsForBoard = async (boardId: string) => {
  try {
    const columns = await prisma.column.findMany({
      where: { boardId },
      include: { tasks: true },
    });
    return { success: true, columns };
  } catch (error) {
    logger.error(`Error Fetching Columns: ${error}`);
    throw new CustomError(500, "Failed to fetch columns");
  }
};

// Update a column
export const updateColumn = async (columnId: string, name: string) => {
  try {
    const updated = await prisma.column.update({
      where: { id: columnId },
      data: { name },
    });
    return { success: true, column: updated };
  } catch (error) {
    logger.error(`Error Updating Column: ${error}`);
    throw new CustomError(500, "Failed to update column");
  }
};

// Delete a column
export const deleteColumn = async (columnId: string) => {
  try {
    const deleted = await prisma.column.delete({
      where: { id: columnId },
    });
    return { success: true, column: deleted };
  } catch (error) {
    logger.error(`Error Deleting Column: ${error}`);
    throw new CustomError(500, "Failed to delete column");
  }
};

// Reorder tasks in a column
export const reorderColumnTasks = async (columnId: string, orderedTaskIds: string[]) => {
  try {
    // Fetch all tasks in the column
    const tasks = await prisma.task.findMany({
      where: { columnId, deletedAt: null },
      select: { id: true }
    });

    // Validate all provided IDs belong to this column
    const taskIdsInColumn = tasks.map(t => t.id);
    const allValid = orderedTaskIds.every(id => taskIdsInColumn.includes(id));
    if (!allValid) {
      throw new CustomError(400, "One or more task IDs do not belong to this column");
    }

    // Update the order field for each task
    const updates = orderedTaskIds.map((taskId, idx) =>
      prisma.task.update({
        where: { id: taskId },
        data: { order: idx }
      })
    );
    await prisma.$transaction(updates);

    return { success: true, message: "Tasks reordered successfully" };
  } catch (error) {
    logger.error(`Error Reordering Column Tasks: ${error}`);
    throw new CustomError(500, "Failed to reorder column tasks");
  }
};