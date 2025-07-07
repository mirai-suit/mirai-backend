import prisma from "../config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import { BoardRole, GrantSource } from "@prisma/client";

// Get all users with access to a board
export const getBoardAccessList = async (boardId: string) => {
  return prisma.boardAccess.findMany({
    where: { boardId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
    },
  });
};

// Get user's role on a specific board
export const getUserBoardRole = async (
  userId: string,
  boardId: string
): Promise<BoardRole | null> => {
  const access = await prisma.boardAccess.findUnique({
    where: { userId_boardId: { userId, boardId } },
    select: { role: true },
  });
  return access?.role || null;
};

// Check if user has minimum required role on a board
export const hasMinimumBoardRole = async (
  userId: string,
  boardId: string,
  minRole: BoardRole
): Promise<boolean> => {
  const userRole = await getUserBoardRole(userId, boardId);
  if (!userRole) return false;

  // Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
  const roleHierarchy = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3,
    OWNER: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[minRole];
};

// Grant board access to a user
export const grantBoardAccess = async ({
  boardId,
  userId,
  role,
  grantedBy,
  grantedVia,
  sourceTeamId,
}: {
  boardId: string;
  userId: string;
  role: BoardRole;
  grantedBy: string;
  grantedVia: GrantSource;
  sourceTeamId?: string;
}) => {
  try {
    // Check if access already exists
    const existingAccess = await prisma.boardAccess.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });

    if (existingAccess) {
      // Update existing access
      return await prisma.boardAccess.update({
        where: { userId_boardId: { userId, boardId } },
        data: {
          role,
          grantedBy,
          grantedVia,
          sourceTeamId,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    } else {
      // Create new access
      return await prisma.boardAccess.create({
        data: {
          boardId,
          userId,
          role,
          grantedBy,
          grantedVia,
          sourceTeamId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    }
  } catch (error) {
    logger.error(`Error granting board access: ${error}`);
    throw new CustomError(500, "Failed to grant board access");
  }
};

// Update user's board role
export const updateBoardRole = async (
  boardId: string,
  userId: string,
  newRole: BoardRole,
  updatedBy: string
) => {
  try {
    const access = await prisma.boardAccess.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });

    if (!access) {
      throw new CustomError(404, "Board access not found");
    }

    return await prisma.boardAccess.update({
      where: { userId_boardId: { userId, boardId } },
      data: {
        role: newRole,
        grantedBy: updatedBy,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error updating board role: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to update board role");
  }
};

// Remove user's board access
export const removeBoardAccess = async (boardId: string, userId: string) => {
  try {
    const access = await prisma.boardAccess.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });

    if (!access) {
      throw new CustomError(404, "Board access not found");
    }

    // Don't allow removing the last OWNER
    if (access.role === "OWNER") {
      const ownerCount = await prisma.boardAccess.count({
        where: { boardId, role: "OWNER" },
      });
      if (ownerCount === 1) {
        throw new CustomError(400, "Cannot remove the last owner of the board");
      }
    }

    await prisma.boardAccess.delete({
      where: { userId_boardId: { userId, boardId } },
    });

    return { success: true, message: "Board access removed successfully" };
  } catch (error) {
    logger.error(`Error removing board access: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to remove board access");
  }
};

// Grant access to all organization members when board is created
export const grantOrganizationAccess = async (
  boardId: string,
  organizationId: string,
  creatorId: string
) => {
  try {
    const orgUsers = await prisma.organizationUser.findMany({
      where: { organizationId },
      select: { userId: true },
    });

    const accessData = orgUsers.map((orgUser) => ({
      boardId,
      userId: orgUser.userId,
      role: orgUser.userId === creatorId ? BoardRole.OWNER : BoardRole.VIEWER,
      grantedBy: creatorId,
      grantedVia: GrantSource.ORGANIZATION,
    }));

    await prisma.boardAccess.createMany({
      data: accessData,
      skipDuplicates: true,
    });

    return { success: true, message: "Organization access granted" };
  } catch (error) {
    logger.error(`Error granting organization access: ${error}`);
    throw new CustomError(500, "Failed to grant organization access");
  }
};

// Grant access to team members when board is assigned to team
export const grantTeamAccess = async (
  boardId: string,
  teamId: string,
  grantedBy: string
) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true, role: true },
    });

    const accessData = teamMembers.map((member) => {
      // Map team roles to board roles
      let boardRole: BoardRole;
      switch (member.role) {
        case "LEADER":
          boardRole = BoardRole.ADMIN;
          break;
        case "MEMBER":
          boardRole = BoardRole.EDITOR;
          break;
        default:
          boardRole = BoardRole.VIEWER;
      }

      return {
        boardId,
        userId: member.userId,
        role: boardRole,
        grantedBy,
        grantedVia: GrantSource.TEAM,
        sourceTeamId: teamId,
      };
    });

    // Use upsert to handle existing access
    for (const access of accessData) {
      await prisma.boardAccess.upsert({
        where: {
          userId_boardId: {
            userId: access.userId,
            boardId: access.boardId,
          },
        },
        update: {
          role: access.role,
          grantedBy: access.grantedBy,
          grantedVia: access.grantedVia,
          sourceTeamId: access.sourceTeamId,
          updatedAt: new Date(),
        },
        create: access,
      });
    }

    return { success: true, message: "Team access granted" };
  } catch (error) {
    logger.error(`Error granting team access: ${error}`);
    throw new CustomError(500, "Failed to grant team access");
  }
};

// Check what actions a user can perform on a board
export const getBoardPermissions = async (userId: string, boardId: string) => {
  const role = await getUserBoardRole(userId, boardId);

  if (!role) {
    return {
      canView: false,
      canEdit: false,
      canAdmin: false,
      canDelete: false,
      canManageAccess: false,
      canManageTeams: false,
    };
  }

  return {
    canView: true,
    canEdit: ["EDITOR", "ADMIN", "OWNER"].includes(role),
    canAdmin: ["ADMIN", "OWNER"].includes(role),
    canDelete: role === "OWNER",
    canManageAccess: ["ADMIN", "OWNER"].includes(role),
    canManageTeams: ["ADMIN", "OWNER"].includes(role),
  };
};
