import { Request, Response, NextFunction } from "express";
import * as boardService from "../services/board.service";
import logger from "src/utils/logger";
import type {
  CreateBoardResponseDto,
  GetBoardResponseDto,
  GetBoardsResponseDto,
  UpdateBoardResponseDto,
  DeleteBoardResponseDto,
  BoardAccessResponseActionDto,
} from "src/interfaces/DTOs/board/response.dto";

// Create a new board
export const createBoard = async (
  req: Request,
  res: Response<CreateBoardResponseDto>,
  next: NextFunction
) => {
  try {
    // All validation is now handled by middleware
    const result = await boardService.createBoard(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Board Controller Error: ${error}`);
    next(error);
  }
};

// Get a board by ID
export const getBoardById = async (
  req: Request,
  res: Response<GetBoardResponseDto>,
  next: NextFunction
) => {
  try {
    // boardId validation handled by middleware
    const { boardId } = req.params;
    const result = await boardService.getBoardById(boardId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Board Controller Error: ${error}`);
    next(error);
  }
};

// Get all boards for an organization
export const getBoardsForOrganization = async (
  req: Request,
  res: Response<GetBoardsResponseDto>,
  next: NextFunction
) => {
  try {
    // organizationId validation handled by middleware
    const { organizationId } = req.params;
    const result = await boardService.getBoardsForOrganization(organizationId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Boards For Org Controller Error: ${error}`);
    next(error);
  }
};

// Update a board
export const updateBoard = async (
  req: Request,
  res: Response<UpdateBoardResponseDto>,
  next: NextFunction
) => {
  try {
    // Validation handled by middleware
    const { boardId } = req.params;
    const updateData = req.body;
    const result = await boardService.updateBoard(boardId, updateData);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Board Controller Error: ${error}`);
    next(error);
  }
};

// Delete a board
export const deleteBoard = async (
  req: Request,
  res: Response<DeleteBoardResponseDto>,
  next: NextFunction
) => {
  try {
    // boardId validation handled by middleware
    const { boardId } = req.params;
    const result = await boardService.deleteBoard(boardId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Board Controller Error: ${error}`);
    next(error);
  }
};

// Add user access to a board
export const addUserToBoard = async (
  req: Request,
  res: Response<BoardAccessResponseActionDto>,
  next: NextFunction
) => {
  try {
    // Validation handled by middleware
    const { boardId } = req.params;
    const { userId, accessRole } = req.body;
    const result = await boardService.addUserToBoard(
      boardId,
      userId,
      accessRole
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Add User To Board Controller Error: ${error}`);
    next(error);
  }
};

// Remove user access from a board
export const removeUserFromBoard = async (
  req: Request,
  res: Response<BoardAccessResponseActionDto>,
  next: NextFunction
) => {
  try {
    // Validation handled by middleware
    const { boardId, userId } = req.params;
    const result = await boardService.removeUserFromBoard(boardId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Remove User From Board Controller Error: ${error}`);
    next(error);
  }
};

// Change user's access role on a board
export const changeUserBoardRole = async (
  req: Request,
  res: Response<BoardAccessResponseActionDto>,
  next: NextFunction
) => {
  try {
    // Validation handled by middleware
    const { boardId, userId } = req.params;
    const { accessRole } = req.body;
    const result = await boardService.changeUserBoardRole(
      boardId,
      userId,
      accessRole
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Change User Board Role Controller Error: ${error}`);
    next(error);
  }
};
