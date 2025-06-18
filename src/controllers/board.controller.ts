import { Request, Response, NextFunction } from "express";
import * as boardService from "../services/board.service";
import logger from "src/utils/logger";

// Create a new board
export const createBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      organizationId,
      description,
      teamId,
      isArchived,
      isPublic,
      isTemplate,
      isPrivate,
      isReadOnly,
      isShared,
      isDefault,
    } = req.body;
    if (!title || !organizationId) {
      res
        .status(400)
        .json({
          success: false,
          message: "title and organizationId are required",
        });
      return;
    }
    const result = await boardService.createBoard({
      title,
      organizationId,
      description,
      teamId,
      isArchived,
      isPublic,
      isTemplate,
      isPrivate,
      isReadOnly,
      isShared,
      isDefault,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Board Controller Error: ${error}`);
    next(error);
  }
};

// Get a board by ID
export const getBoardById = async (
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
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.params.organizationId || req.body.organizationId;
    if (!organizationId) {
      res
        .status(400)
        .json({ success: false, message: "organizationId is required" });
      return;
    }
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
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, ...updateData } = req.body;
    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }
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
  res: Response,
  next: NextFunction
) => {
  try {
    const boardId = req.params.boardId || req.body.boardId;
    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }
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
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, userId, accessRole } = req.body;
    if (!boardId || !userId) {
      res
        .status(400)
        .json({ success: false, message: "boardId and userId are required" });
      return;
    }
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
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, userId } = req.body;
    if (!boardId || !userId) {
      res
        .status(400)
        .json({ success: false, message: "boardId and userId are required" });
      return;
    }
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
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId, userId, accessRole } = req.body;
    if (!boardId || !userId || !accessRole) {
      res
        .status(400)
        .json({
          success: false,
          message: "boardId, userId, and accessRole are required",
        });
      return;
    }
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
