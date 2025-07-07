import { Request, Response, NextFunction } from "express";
import { BoardRole } from "@prisma/client";
import * as boardAccessService from "../services/boardAccess.service";
import logger from "../utils/logger";

// Extend Request interface to include board permissions
declare global {
  namespace Express {
    interface Request {
      boardRole?: BoardRole;
      boardPermissions?: {
        canView: boolean;
        canEdit: boolean;
        canAdmin: boolean;
        canDelete: boolean;
        canManageAccess: boolean;
        canManageTeams: boolean;
      };
    }
  }
}

// Basic board access middleware - checks if user has any access to board
export const requireBoardAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!boardId) {
      res.status(400).json({
        success: false,
        message: "Board ID is required",
      });
      return;
    }

    const userRole = await boardAccessService.getUserBoardRole(userId, boardId);

    if (!userRole) {
      res.status(403).json({
        success: false,
        message: "Access denied: No permission to access this board",
      });
      return;
    }

    // Add role and permissions to request for use in controllers
    req.boardRole = userRole;
    req.boardPermissions = await boardAccessService.getBoardPermissions(
      userId,
      boardId
    );

    next();
  } catch (error) {
    logger.error(`Board access middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Middleware factory for specific board role requirements
export const requireMinimumBoardRole = (minRole: BoardRole) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const boardId = req.params.boardId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!boardId) {
        res.status(400).json({
          success: false,
          message: "Board ID is required",
        });
        return;
      }

      const hasRole = await boardAccessService.hasMinimumBoardRole(
        userId,
        boardId,
        minRole
      );

      if (!hasRole) {
        res.status(403).json({
          success: false,
          message: `Access denied: Requires ${minRole} role or higher`,
        });
        return;
      }

      // Add role and permissions to request
      const userRole = await boardAccessService.getUserBoardRole(
        userId,
        boardId
      );
      req.boardRole = userRole!;
      req.boardPermissions = await boardAccessService.getBoardPermissions(
        userId,
        boardId
      );

      next();
    } catch (error) {
      logger.error(`Board role middleware error: ${error}`);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

// Specific role requirement middlewares
export const requireBoardViewer = requireMinimumBoardRole(BoardRole.VIEWER);
export const requireBoardEditor = requireMinimumBoardRole(BoardRole.EDITOR);
export const requireBoardAdmin = requireMinimumBoardRole(BoardRole.ADMIN);
export const requireBoardOwner = requireMinimumBoardRole(BoardRole.OWNER);

// Permission-based middleware
export const requireBoardEdit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId;

    if (!userId || !boardId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }

    const permissions = await boardAccessService.getBoardPermissions(
      userId,
      boardId
    );

    if (!permissions.canEdit) {
      res.status(403).json({
        success: false,
        message: "Access denied: Edit permission required",
      });
      return;
    }

    req.boardPermissions = permissions;
    next();
  } catch (error) {
    logger.error(`Board edit permission middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requireBoardAdminPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId;

    if (!userId || !boardId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }

    const permissions = await boardAccessService.getBoardPermissions(
      userId,
      boardId
    );

    if (!permissions.canAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied: Admin permission required",
      });
      return;
    }

    req.boardPermissions = permissions;
    next();
  } catch (error) {
    logger.error(`Board admin permission middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requireBoardDelete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId;

    if (!userId || !boardId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }

    const permissions = await boardAccessService.getBoardPermissions(
      userId,
      boardId
    );

    if (!permissions.canDelete) {
      res.status(403).json({
        success: false,
        message: "Access denied: Only board owners can delete boards",
      });
      return;
    }

    req.boardPermissions = permissions;
    next();
  } catch (error) {
    logger.error(`Board delete permission middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requireBoardManageAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const boardId = req.params.boardId;

    if (!userId || !boardId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
      return;
    }

    const permissions = await boardAccessService.getBoardPermissions(
      userId,
      boardId
    );

    if (!permissions.canManageAccess) {
      res.status(403).json({
        success: false,
        message: "Access denied: Access management permission required",
      });
      return;
    }

    req.boardPermissions = permissions;
    next();
  } catch (error) {
    logger.error(`Board manage access middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
