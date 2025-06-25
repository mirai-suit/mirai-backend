import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import { OrganizationRole } from "src/interfaces/enums/organization";

// Create a new organization
export const createOrganization = async (name: string, ownerId: string) => {
  try {
    const organization = await prisma.organization.create({
      data: {
        name,
        creatorId: ownerId, // Set the creator
        organizationUser: {
          create: {
            userId: ownerId,
            role: OrganizationRole.ADMIN, // Use enum instead of string
          },
        },
      },
    });

    if (!organization) {
      throw new CustomError(404, "Cannot Create Organization");
    }

    return { success: true, organization };
  } catch (error) {
    logger.error(`Error in Organization/Create: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to Create Organization");
  }
};

// Add a member to an organization
export const addMemberToOrganization = async ({
  organization,
  userId,
  role,
}: {
  organization: string;
  userId: string;
  role: OrganizationRole;
}) => {
  try {
    const added = await prisma.organizationUser.create({
      data: {
        organizationId: organization,
        userId,
        role,
      },
    });

    if (!added) {
      throw new CustomError(404, "Cannot Add Member to Organization");
    }

    return { success: true, user: added };
  } catch (error) {
    logger.error(`Error Adding user: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to Add user to Organization");
  }
};

// Remove a member from organization
export const removeMemberFromOrganization = async (
  orgId: string,
  userId: string
) => {
  try {
    const removed = await prisma.organizationUser.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!removed) {
      throw new CustomError(404, "Member not found in organization");
    }

    return { success: true, user: removed };
  } catch (error) {
    logger.error(`Error Removing user: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to Remove Member from Organization");
  }
};

// Change role of a member
export const changeUserRoleInOrganization = async (
  orgId: string,
  userId: string,
  newRole: OrganizationRole
) => {
  try {
    const updated = await prisma.organizationUser.update({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      data: {
        role: newRole,
      },
    });

    if (!updated) {
      throw new CustomError(404, "User not found or role not updated");
    }

    return { success: true, user: updated };
  } catch (error) {
    logger.error(`Error Changing Role: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to Change Role");
  }
};

// Get all members of an organization
export const getOrganizationMembers = async (orgId: string) => {
  try {
    const members = await prisma.organizationUser.findMany({
      where: { organizationId: orgId },
      include: { user: true },
    });

    return { success: true, members };
  } catch (error) {
    logger.error(`Error Fetching Members: ${error}`);
    throw new CustomError(500, "Failed to Fetch Members");
  }
};

// Get all organizations a user belongs to
export const getUserOrganizations = async (userId: string) => {
  try {
    const memberships = await prisma.organizationUser.findMany({
      where: { userId },
      include: { organization: true },
    });

    // Include user's role in each organization
    const organizations = memberships.map((membership) => ({
      ...membership.organization,
      role: membership.role, // Add the user's role in this organization
      memberCount: 0, // Will be populated by separate query if needed
      boardCount: 0, // Will be populated by separate query if needed
      isCreator: membership.organization.creatorId === userId,
    }));

    return { success: true, organizations };
  } catch (error) {
    logger.error(`Error Fetching Organizations: ${error}`);
    throw new CustomError(500, "Failed to Fetch Organizations");
  }
};

// Get full details of an organization
export const getOrganizationDetails = async (orgId: string) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        organizationUser: { include: { user: true } },
        boards: true,
      },
    });

    if (!organization) {
      throw new CustomError(404, "Organization not found");
    }

    return { success: true, organization };
  } catch (error) {
    logger.error(`Error Fetching Organization Details: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to Fetch Organization Details");
  }
};
