import { Request, Response, NextFunction } from "express";
import * as organizationService from "../services/organization.service";
import logger from "src/utils/logger";
import { OrganizationRequest } from "../middlewares/organization.middleware";
import { OrganizationRole } from "../interfaces/enums/organization";

// Create a new organization
export const createOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;
    const ownerId = req.user?.id; // Assumes user is authenticated and user id is attached to req.user

    if (!name || !ownerId) {
      res
        .status(400)
        .json({
          success: false,
          message: "Organization name and ownerId are required",
        });
      return;
    }

    const result = await organizationService.createOrganization(name, ownerId);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Organization Controller Error: ${error}`);
    next(error);
  }
};

// Add a member to an organization (requires admin role)
export const addMemberToOrganization = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, role = OrganizationRole.MEMBER } = req.body;
    const organizationId = req.organizationId!;

    if (!userId) {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    // Validate role
    if (!Object.values(OrganizationRole).includes(role)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid role specified" });
      return;
    }

    const result = await organizationService.addMemberToOrganization({
      organization: organizationId,
      userId,
      role,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Add Member Controller Error: ${error}`);
    next(error);
  }
};

// Remove a member from organization (requires admin role)
export const removeMemberFromOrganization = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const organizationId = req.organizationId!;

    if (!userId) {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    const result = await organizationService.removeMemberFromOrganization(
      organizationId,
      userId
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Remove Member Controller Error: ${error}`);
    next(error);
  }
};

// Change role of a member (requires admin role)
export const changeUserRoleInOrganization = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, newRole } = req.body;
    const organizationId = req.organizationId!;

    if (!userId || !newRole) {
      res
        .status(400)
        .json({ success: false, message: "userId and newRole are required" });
      return;
    }

    // Validate role
    if (!Object.values(OrganizationRole).includes(newRole)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid role specified" });
      return;
    }

    const result = await organizationService.changeUserRoleInOrganization(
      organizationId,
      userId,
      newRole
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Change Role Controller Error: ${error}`);
    next(error);
  }
};

// Get all members of an organization
export const getOrganizationMembers = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId!;

    const result = await organizationService.getOrganizationMembers(
      organizationId
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Members Controller Error: ${error}`);
    next(error);
  }
};

// Get all organizations a user belongs to
export const getUserOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      res.status(400).json({ success: false, message: "userId is required" });
    }

    const result = await organizationService.getUserOrganizations(userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get User Orgs Controller Error: ${error}`);
    next(error);
  }
};

// Get full details of an organization
export const getOrganizationDetails = async (
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.organizationId!;

    const result = await organizationService.getOrganizationDetails(
      organizationId
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Org Details Controller Error: ${error}`);
    next(error);
  }
};
