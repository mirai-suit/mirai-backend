import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma/prisma.client";
import {
  OrganizationRole,
  hasPermission,
  OrganizationPermissions,
} from "../interfaces/enums/organization";

// Extend the existing Request interface to include organization-specific fields
export interface OrganizationRequest extends Request {
  organizationRole?: OrganizationRole;
  organizationId?: string;
}

// Middleware to check organization membership and set role
export const checkOrganizationMembership = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
      return;
    }

    // Check if user is member of the organization
    const organizationUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!organizationUser) {
      res.status(403).json({
        success: false,
        message: "You are not a member of this organization",
      });
      return;
    }

    // Add organization role to request
    req.organizationRole = organizationUser.role as OrganizationRole;
    req.organizationId = organizationId;

    next();
  } catch (error) {
    console.error("Organization membership check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Middleware factory to check specific permissions
export const requireOrganizationPermission = (
  permission: keyof OrganizationPermissions
) => {
  return (
    req: OrganizationRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const userRole = req.organizationRole;

      if (!userRole) {
        res.status(403).json({
          success: false,
          message: "Organization role not found",
        });
        return;
      }

      const hasRequiredPermission = hasPermission(userRole, permission);

      if (!hasRequiredPermission) {
        res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required permission: ${permission}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

// Middleware to require admin role
export const requireOrganizationAdmin =
  requireOrganizationPermission("updateOrgSettings");

// Middleware to require editor or admin role
export const requireEditorOrAdmin = (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
): void => {
  const userRole = req.organizationRole;

  if (!userRole) {
    res.status(403).json({
      success: false,
      message: "Organization role not found",
    });
    return;
  }

  if (userRole === OrganizationRole.MEMBER) {
    res.status(403).json({
      success: false,
      message: "Editor or Admin role required",
    });
    return;
  }

  next();
};

// Helper function to get user's organization role
export const getUserOrganizationRole = async (
  userId: string,
  organizationId: string
): Promise<OrganizationRole | null> => {
  try {
    const organizationUser = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return (organizationUser?.role as OrganizationRole) || null;
  } catch (error) {
    console.error("Error getting user organization role:", error);
    return null;
  }
};
