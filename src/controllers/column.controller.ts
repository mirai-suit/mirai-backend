import { Request, Response, NextFunction } from "express";
import * as columnService from "../services/column.service";
import logger from "src/utils/logger";
import {
  CreateColumnInput,
  UpdateColumnRequestInput,
  ReorderColumnTasksRequestInput,
  ColumnIdParam,
  BoardIdParam,
} from "src/schemas/column.schema";
import {
  CreateColumnDto,
  UpdateColumnDto,
  ReorderColumnTasksDto,
  GetColumnsForBoardDto,
  DeleteColumnDto,
} from "src/interfaces/DTOs/column/request.dto";

// Create a new column
export const createColumn = async (
  req: Request<{}, any, CreateColumnInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const createColumnDto: CreateColumnDto = req.body;
    const result = await columnService.createColumn(createColumnDto);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Column Controller Error: ${error}`);
    next(error);
  }
};

// Get all columns for a board
export const getColumnsForBoard = async (
  req: Request<BoardIdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const getColumnsDto: GetColumnsForBoardDto = {
      boardId: req.params.boardId,
    };
    const result = await columnService.getColumnsForBoard(
      getColumnsDto.boardId
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Columns For Board Controller Error: ${error}`);
    next(error);
  }
};

// Update a column
export const updateColumn = async (
  req: Request<{}, any, UpdateColumnRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updateColumnDto: UpdateColumnDto = req.body;
    const result = await columnService.updateColumn(updateColumnDto);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Column Controller Error: ${error}`);
    next(error);
  }
};

// Delete a column
export const deleteColumn = async (
  req: Request<ColumnIdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleteColumnDto: DeleteColumnDto = {
      columnId: req.params.columnId,
    };
    const result = await columnService.deleteColumn(deleteColumnDto.columnId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Column Controller Error: ${error}`);
    next(error);
  }
};

// Reorder tasks in a column
export const reorderColumnTasks = async (
  req: Request<ColumnIdParam, any, ReorderColumnTasksRequestInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const reorderDto: ReorderColumnTasksDto = {
      columnId: req.params.columnId,
      orderedTaskIds: req.body.orderedTaskIds,
    };
    const result = await columnService.reorderColumnTasks(
      reorderDto.columnId,
      reorderDto.orderedTaskIds
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Reorder Column Tasks Controller Error: ${error}`);
    next(error);
  }
};
