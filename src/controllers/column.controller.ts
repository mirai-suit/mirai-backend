import { Request, Response, NextFunction } from "express";
import * as columnService from "../services/column.service";
import logger from "src/utils/logger";

// Create a new column
export const createColumn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, boardId } = req.body;
    if (!name || !boardId) {
      res
        .status(400)
        .json({ success: false, message: "name and boardId are required" });
      return;
    }
    const result = await columnService.createColumn({ name, boardId });
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Column Controller Error: ${error}`);
    next(error);
  }
};

// Get all columns for a board
export const getColumnsForBoard = async (
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
    const result = await columnService.getColumnsForBoard(boardId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Columns For Board Controller Error: ${error}`);
    next(error);
  }
};

// Update a column
export const updateColumn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { columnId, name } = req.body;
    if (!columnId || !name) {
      res
        .status(400)
        .json({ success: false, message: "columnId and name are required" });
      return;
    }
    const result = await columnService.updateColumn(columnId, name);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Column Controller Error: ${error}`);
    next(error);
  }
};

// Delete a column
export const deleteColumn = async (
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
    const result = await columnService.deleteColumn(columnId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Column Controller Error: ${error}`);
    next(error);
  }
};

// Reorder tasks in a column
export const reorderColumnTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { columnId, orderedTaskIds } = req.body;
    if (!columnId || !Array.isArray(orderedTaskIds)) {
      res.status(400).json({
        success: false,
        message: "columnId and orderedTaskIds array are required",
      });
      return;
    }
    const result = await columnService.reorderColumnTasks(
      columnId,
      orderedTaskIds
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Reorder Column Tasks Controller Error: ${error}`);
    next(error);
  }
};
