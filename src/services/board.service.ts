import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import {
  CreateBoardResponseDto,
  GetBoardResponseDto,
  GetBoardsResponseDto,
  UpdateBoardResponseDto,
  DeleteBoardResponseDto,
  BoardAccessResponseActionDto,
} from "src/interfaces/DTOs/board/response.dto";

// Default column templates
const DEFAULT_COLUMN_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

// Create a new board in an organization
export const createBoard = async (data: {
  title: string;
  organizationId: string;
  description?: string;
  color?: string;
  coverImage?: string;
  teamId?: string;
  isArchived?: boolean;
  isPublic?: boolean;
  isTemplate?: boolean;
  isPrivate?: boolean;
  isReadOnly?: boolean;
  isShared?: boolean;
  isDefault?: boolean;
  defaultColumns?: string[];
}): Promise<CreateBoardResponseDto> => {
  try {
    const board = await prisma.board.create({
      data: {
        title: data.title,
        organizationId: data.organizationId,
        description: data.description,
        color: data.color || "#3B82F6",
        coverImage: data.coverImage,
        teamId: data.teamId,
        isArchived: data.isArchived ?? false,
        isPublic: data.isPublic ?? false,
        isTemplate: data.isTemplate ?? false,
        isPrivate: data.isPrivate ?? false,
        isReadOnly: data.isReadOnly ?? false,
        isShared: data.isShared ?? false,
        isDefault: data.isDefault ?? false,
        columns: data.defaultColumns
          ? {
              create: data.defaultColumns.map((name, index) => ({
                name,
                color:
                  DEFAULT_COLUMN_COLORS[index % DEFAULT_COLUMN_COLORS.length],
                order: index,
              })),
            }
          : {
              create: [
                { name: "To Do", color: "#3B82F6", order: 0 },
                { name: "In Progress", color: "#F59E0B", order: 1 },
                { name: "Done", color: "#10B981", order: 2 },
              ],
            },
      },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!board) throw new CustomError(400, "Board creation failed");

    return {
      success: true,
      message: "Board created successfully",
      board: {
        id: board.id,
        title: board.title,
        description: board.description || undefined,
        color: board.color,
        coverImage: board.coverImage || undefined,
        organizationId: board.organizationId,
        teamId: board.teamId || undefined,
        isArchived: board.isArchived,
        isPublic: board.isPublic,
        isTemplate: board.isTemplate,
        isPrivate: board.isPrivate,
        isReadOnly: board.isReadOnly,
        isShared: board.isShared,
        isDefault: board.isDefault,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: board.columns.map((col) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    logger.error(`Error Creating Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to create board");
  }
};

// Get Board by ID
export const getBoardById = async (
  boardId: string
): Promise<GetBoardResponseDto> => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          include: { tasks: true },
          orderBy: { order: "asc" },
        },
        tasks: true,
        team: true,
        accessList: { include: { user: true } },
      },
    });
    if (!board) throw new CustomError(404, "Board not found");

    return {
      success: true,
      board: {
        id: board.id,
        title: board.title,
        description: board.description || undefined,
        color: board.color,
        coverImage: board.coverImage || undefined,
        organizationId: board.organizationId,
        teamId: board.teamId || undefined,
        isArchived: board.isArchived,
        isPublic: board.isPublic,
        isTemplate: board.isTemplate,
        isPrivate: board.isPrivate,
        isReadOnly: board.isReadOnly,
        isShared: board.isShared,
        isDefault: board.isDefault,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: board.columns.map((col) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
        tasks: board.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          priority: task.priority || undefined,
          order: task.order || undefined,
          columnId: task.columnId,
          boardId: task.boardId,
          isRecurring: task.isRecurring,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          deletedAt: task.deletedAt?.toISOString(),
        })),
        team: board.team.map((team) => ({
          id: team.id,
          name: team.name,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        })),
        accessList: board.accessList.map((access) => ({
          id: access.id,
          userId: access.userId,
          boardId: access.boardId,
          accessRole: access.accessRole,
          user: access.user
            ? {
                id: access.user.id,
                firstName: access.user.firstName,
                lastName: access.user.lastName,
                email: access.user.email,
                avatar: access.user.avatar || undefined,
              }
            : undefined,
        })),
      },
    };
  } catch (error) {
    logger.error(`Error Fetching Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to fetch board");
  }
};

// Get all boards for an organization
export const getBoardsForOrganization = async (
  organizationId: string
): Promise<GetBoardsResponseDto> => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        organizationId,
        deletedAt: null, // Exclude soft-deleted boards
      },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
        tasks: true,
        team: true,
        accessList: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      boards: boards.map((board) => ({
        id: board.id,
        title: board.title,
        description: board.description || undefined,
        color: board.color,
        coverImage: board.coverImage || undefined,
        organizationId: board.organizationId,
        teamId: board.teamId || undefined,
        isArchived: board.isArchived,
        isPublic: board.isPublic,
        isTemplate: board.isTemplate,
        isPrivate: board.isPrivate,
        isReadOnly: board.isReadOnly,
        isShared: board.isShared,
        isDefault: board.isDefault,
        deletedAt: board.deletedAt?.toISOString(),
        deletedBy: board.deletedBy || undefined,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: board.columns.map((col) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
        tasks: board.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          priority: task.priority || undefined,
          order: task.order || undefined,
          columnId: task.columnId,
          boardId: task.boardId,
          isRecurring: task.isRecurring,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          deletedAt: task.deletedAt?.toISOString(),
        })),
        team: board.team.map((team) => ({
          id: team.id,
          name: team.name,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        })),
        accessList: board.accessList.map((access) => ({
          id: access.id,
          userId: access.userId,
          boardId: access.boardId,
          accessRole: access.accessRole,
        })),
      })),
    };
  } catch (error) {
    logger.error(`Error Fetching Boards: ${error}`);
    throw new CustomError(500, "Failed to fetch boards");
  }
};

// Update a board
export const updateBoard = async (
  boardId: string,
  data: Partial<{
    title: string;
    description: string;
    color: string;
    coverImage: string;
    teamId: string;
    isArchived: boolean;
    isPublic: boolean;
    isTemplate: boolean;
    isPrivate: boolean;
    isReadOnly: boolean;
    isShared: boolean;
    isDefault: boolean;
  }>
): Promise<UpdateBoardResponseDto> => {
  try {
    const updated = await prisma.board.update({
      where: { id: boardId },
      data,
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
      },
    });
    if (!updated) throw new CustomError(404, "Board not found or not updated");

    return {
      success: true,
      message: "Board updated successfully",
      board: {
        id: updated.id,
        title: updated.title,
        description: updated.description || undefined,
        color: updated.color,
        coverImage: updated.coverImage || undefined,
        organizationId: updated.organizationId,
        teamId: updated.teamId || undefined,
        isArchived: updated.isArchived,
        isPublic: updated.isPublic,
        isTemplate: updated.isTemplate,
        isPrivate: updated.isPrivate,
        isReadOnly: updated.isReadOnly,
        isShared: updated.isShared,
        isDefault: updated.isDefault,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        columns: updated.columns.map((col) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    logger.error(`Error Updating Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to update board");
  }
};

// Soft delete a board
export const deleteBoard = async (
  boardId: string,
  deletedBy?: string
): Promise<DeleteBoardResponseDto> => {
  try {
    // Soft delete by setting deletedAt timestamp
    const deleted = await prisma.board.update({
      where: { id: boardId, deletedAt: null }, // Ensure it's not already deleted
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });

    return {
      success: true,
      message: "Board moved to trash successfully",
      board: {
        id: deleted.id,
        title: deleted.title,
      },
    };
  } catch (error) {
    logger.error(`Error Soft Deleting Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to delete board");
  }
};

// Restore a soft-deleted board
export const restoreBoard = async (
  boardId: string
): Promise<UpdateBoardResponseDto> => {
  try {
    const restored = await prisma.board.update({
      where: { id: boardId, deletedAt: { not: null } }, // Ensure it's soft-deleted
      data: {
        deletedAt: null,
        deletedBy: null,
      },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
        tasks: true,
        team: true,
        accessList: true,
      },
    });

    return {
      success: true,
      message: "Board restored successfully",
      board: {
        id: restored.id,
        title: restored.title,
        description: restored.description || undefined,
        color: restored.color,
        coverImage: restored.coverImage || undefined,
        organizationId: restored.organizationId,
        teamId: restored.teamId || undefined,
        isArchived: restored.isArchived,
        isPublic: restored.isPublic,
        isTemplate: restored.isTemplate,
        isPrivate: restored.isPrivate,
        isReadOnly: restored.isReadOnly,
        isShared: restored.isShared,
        isDefault: restored.isDefault,
        deletedAt: undefined, // Should be null now
        deletedBy: undefined, // Should be null now
        createdAt: restored.createdAt.toISOString(),
        updatedAt: restored.updatedAt.toISOString(),
        columns: restored.columns?.map((col: any) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
        tasks: restored.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          priority: task.priority || undefined,
          order: task.order || undefined,
          columnId: task.columnId,
          boardId: task.boardId,
          isRecurring: task.isRecurring,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          deletedAt: task.deletedAt?.toISOString(),
        })),
        team: restored.team?.map((team: any) => ({
          id: team.id,
          name: team.name,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        })),
        accessList: restored.accessList?.map((access: any) => ({
          id: access.id,
          userId: access.userId,
          boardId: access.boardId,
          accessRole: access.accessRole,
        })),
      },
    };
  } catch (error) {
    logger.error(`Error Restoring Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to restore board");
  }
};

// Permanently delete a board (only for trash bin functionality)
export const permanentlyDeleteBoard = async (
  boardId: string
): Promise<DeleteBoardResponseDto> => {
  try {
    // First check if the board is soft-deleted
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true, title: true, deletedAt: true },
    });

    if (!board) {
      throw new CustomError(404, "Board not found");
    }

    if (!board.deletedAt) {
      throw new CustomError(
        400,
        "Board must be in trash before permanent deletion"
      );
    }

    // Permanently delete
    const deleted = await prisma.board.delete({
      where: { id: boardId },
    });

    return {
      success: true,
      message: "Board permanently deleted",
      board: {
        id: deleted.id,
        title: deleted.title,
      },
    };
  } catch (error) {
    logger.error(`Error Permanently Deleting Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to permanently delete board");
  }
};

// Get soft-deleted boards (trash bin)
export const getTrashedBoards = async (
  organizationId: string
): Promise<GetBoardsResponseDto> => {
  try {
    const boards = await prisma.board.findMany({
      where: {
        organizationId,
        deletedAt: { not: null }, // Only soft-deleted boards
      },
      include: {
        columns: {
          orderBy: { order: "asc" },
        },
        tasks: true,
        team: true,
        accessList: true,
      },
      orderBy: { deletedAt: "desc" }, // Most recently deleted first
    });

    return {
      success: true,
      boards: boards.map((board: any) => ({
        id: board.id,
        title: board.title,
        description: board.description || undefined,
        color: board.color,
        coverImage: board.coverImage || undefined,
        organizationId: board.organizationId,
        teamId: board.teamId || undefined,
        isArchived: board.isArchived,
        isPublic: board.isPublic,
        isTemplate: board.isTemplate,
        isPrivate: board.isPrivate,
        isReadOnly: board.isReadOnly,
        isShared: board.isShared,
        isDefault: board.isDefault,
        deletedAt: board.deletedAt?.toISOString(),
        deletedBy: board.deletedBy || undefined,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        columns: board.columns?.map((col: any) => ({
          id: col.id,
          name: col.name,
          color: col.color,
          order: col.order,
          boardId: col.boardId,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
        })),
        tasks: board.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          priority: task.priority || undefined,
          order: task.order || undefined,
          columnId: task.columnId,
          boardId: task.boardId,
          isRecurring: task.isRecurring,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          deletedAt: task.deletedAt?.toISOString(),
        })),
        team: board.team?.map((team: any) => ({
          id: team.id,
          name: team.name,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString(),
        })),
        accessList: board.accessList?.map((access: any) => ({
          id: access.id,
          userId: access.userId,
          boardId: access.boardId,
          accessRole: access.accessRole,
        })),
      })),
    };
  } catch (error) {
    logger.error(`Error Getting Trashed Boards: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to get trashed boards");
  }
};

// Add user access to a board
export const addUserToBoard = async (
  boardId: string,
  userId: string,
  accessRole: string = "MEMBER"
): Promise<BoardAccessResponseActionDto> => {
  try {
    const access = await prisma.boardAccess.create({
      data: {
        boardId,
        userId,
        accessRole,
      },
      include: {
        user: true,
      },
    });

    return {
      success: true,
      message: "User added to board successfully",
      access: {
        id: access.id,
        userId: access.userId,
        boardId: access.boardId,
        accessRole: access.accessRole,
        user: {
          id: access.user.id,
          firstName: access.user.firstName,
          lastName: access.user.lastName,
          email: access.user.email,
          avatar: access.user.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Error Adding User to Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to add user to board");
  }
};

// Remove user access from a board
export const removeUserFromBoard = async (
  boardId: string,
  userId: string
): Promise<BoardAccessResponseActionDto> => {
  try {
    const removed = await prisma.boardAccess.delete({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      include: {
        user: true,
      },
    });

    return {
      success: true,
      message: "User removed from board successfully",
      removed: {
        id: removed.id,
        userId: removed.userId,
        boardId: removed.boardId,
        accessRole: removed.accessRole,
        user: {
          id: removed.user.id,
          firstName: removed.user.firstName,
          lastName: removed.user.lastName,
          email: removed.user.email,
          avatar: removed.user.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Error Removing User from Board: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to remove user from board");
  }
};

// Change user's access role on a board
export const changeUserBoardRole = async (
  boardId: string,
  userId: string,
  accessRole: string
): Promise<BoardAccessResponseActionDto> => {
  try {
    const updated = await prisma.boardAccess.update({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
      data: { accessRole },
      include: {
        user: true,
      },
    });

    return {
      success: true,
      message: "User role updated successfully",
      access: {
        id: updated.id,
        userId: updated.userId,
        boardId: updated.boardId,
        accessRole: updated.accessRole,
        user: {
          id: updated.user.id,
          firstName: updated.user.firstName,
          lastName: updated.user.lastName,
          email: updated.user.email,
          avatar: updated.user.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Error Changing User Board Role: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to change user board role");
  }
};
