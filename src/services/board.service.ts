import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

// Create a new board in an organization
export const createBoard = async (data: {
  title: string;
  organizationId: string;
  description?: string;
  teamId?: string;
  isArchived?: boolean;
  isPublic?: boolean;
  isTemplate?: boolean;
  isPrivate?: boolean;
  isReadOnly?: boolean;
  isShared?: boolean;
  isDefault?: boolean;
  defaultColumns?: string[];
}) => {
  try {
    const board = await prisma.board.create({
      data: {
        title: data.title,
        organizationId: data.organizationId,
        description: data.description,
        teamId: data.teamId,
        isArchived: data.isArchived ?? false,
        isPublic: data.isPublic ?? false,
        isTemplate: data.isTemplate ?? false,
        isPrivate: data.isPrivate ?? false,
        isReadOnly: data.isReadOnly ?? false,
        isShared: data.isShared ?? false,
        isDefault: data.isDefault ?? false,
        columns: data.defaultColumns
          ? { create: data.defaultColumns.map(name => ({ name })) }
          : undefined,
      },
      include: { columns: true },
    });
    if (!board) throw new CustomError(400, "Board creation failed");
    return { success: true, board };
  } catch (error) {
    logger.error(`Error Creating Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to create board");
  }
};

// Get Board by ID
export const getBoardById = async (boardId: string) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: { include: { tasks: true } },
        tasks: true,
        team: true,
        accessList: { include: { user: true } },
      },
    });
    if (!board) throw new CustomError(404, "Board not found");
    return { success: true, board };
  } catch (error) {
    logger.error(`Error Fetching Board: ${error}`);
    throw new CustomError(500, "Failed to fetch board");
  }
};

// Get all boards for an organization
export const getBoardsForOrganization = async (organizationId: string) => {
  try {
    const boards = await prisma.board.findMany({
      where: { organizationId },
      include: {
        columns: true,
        tasks: true,
        team: true,
        accessList: true,
      },
    });
    return { success: true, boards };
  } catch (error) {
    logger.error(`Error Fetching Boards: ${error}`);
    throw new CustomError(500, "Failed to fetch boards");
  }
};

// Update a board
export const updateBoard = async (boardId: string, data: Partial<{
  title: string;
  description: string;
  teamId: string;
  isArchived: boolean;
  isPublic: boolean;
  isTemplate: boolean;
  isPrivate: boolean;
  isReadOnly: boolean;
  isShared: boolean;
  isDefault: boolean;
}>) => {
  try {
    const updated = await prisma.board.update({
      where: { id: boardId },
      data,
    });
    if (!updated) throw new CustomError(404, "Board not found or not updated");
    return { success: true, board: updated };
  } catch (error) {
    logger.error(`Error Updating Board: ${error}`);
    throw new CustomError(500, "Failed to update board");
  }
};

// Delete a board
export const deleteBoard = async (boardId: string) => {
  try {
    const deleted = await prisma.board.delete({
      where: { id: boardId },
    });
    if (!deleted) throw new CustomError(404, "Board not found or not deleted");
    return { success: true, board: deleted };
  } catch (error) {
    logger.error(`Error Deleting Board: ${error}`);
    throw new CustomError(500, "Failed to delete board");
  }
};

// Add user access to a board
export const addUserToBoard = async (boardId: string, userId: string, accessRole: string = "MEMBER") => {
  try {
    const access = await prisma.boardAccess.create({
      data: {
        boardId,
        userId,
        accessRole,
      },
    });
    return { success: true, access };
  } catch (error) {
    logger.error(`Error Adding User to Board: ${error}`);
    throw new CustomError(500, "Failed to add user to board");
  }
};

// Remove user access from a board
export const removeUserFromBoard = async (boardId: string, userId: string) => {
  try {
    const removed = await prisma.boardAccess.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });
    return { success: true, removed };
  } catch (error) {
    logger.error(`Error Removing User from Board: ${error}`);
    throw new CustomError(500, "Failed to remove user from board");
  }
};

// Change user's access role on a board
export const changeUserBoardRole = async (boardId: string, userId: string, accessRole: string) => {
  try {
    const updated = await prisma.boardAccess.update({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      data: { accessRole },
    });
    return { success: true, access: updated };
  } catch (error) {
    logger.error(`Error Changing User Board Role: ${error}`);
    throw new CustomError(500, "Failed to change user board role");
  }
};