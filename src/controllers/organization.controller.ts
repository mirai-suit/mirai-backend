import { Request, Response, NextFunction } from 'express';
import * as organizationService from '../services/organization.service';
import logger from 'src/utils/logger';

// Create a new organization
export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const ownerId = req.user?.id; // Assumes user is authenticated and user id is attached to req.user

    if (!name || !ownerId) {
       res.status(400).json({ success: false, message: 'Organization name and ownerId are required' });
       return;
    }

    const result = await organizationService.createOrganization(name, ownerId);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Organization Controller Error: ${error}`);
    next(error);
  }
};

// Add a member to an organization
export const addMemberToOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organization, userId, role } = req.body;

    if (!organization || !userId || !role) {
       res.status(400).json({ success: false, message: 'organization, userId, and role are required' });
       return;
    }

    const result = await organizationService.addMemberToOrganization({ organization, userId, role });
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Add Member Controller Error: ${error}`);
    next(error);
  }
};

// Remove a member from organization
export const removeMemberFromOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId, userId } = req.body;

    if (!orgId || !userId) {
       res.status(400).json({ success: false, message: 'orgId and userId are required' });
       return;
    }

    const result = await organizationService.removeMemberFromOrganization(orgId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Remove Member Controller Error: ${error}`);
    next(error);
  }
};

// Change role of a member
export const changeUserRoleInOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId, userId, newRole } = req.body;

    if (!orgId || !userId || !newRole) {
       res.status(400).json({ success: false, message: 'orgId, userId, and newRole are required' });
       return;
    }

    const result = await organizationService.changeUserRoleInOrganization(orgId, userId, newRole);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Change Role Controller Error: ${error}`);
    next(error);
  }
};

// Get all members of an organization
export const getOrganizationMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId || req.body.orgId;

    if (!orgId) {
       res.status(400).json({ success: false, message: 'orgId is required' });
       return;
    }

    const result = await organizationService.getOrganizationMembers(orgId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Members Controller Error: ${error}`);
    next(error);
  }
};

// Get all organizations a user belongs to
export const getUserOrganizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
       res.status(400).json({ success: false, message: 'userId is required' });
    }

    const result = await organizationService.getUserOrganizations(userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get User Orgs Controller Error: ${error}`);
    next(error);
  }
};

// Get full details of an organization
export const getOrganizationDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.params.orgId || req.body.orgId;

    if (!orgId) {
       res.status(400).json({ success: false, message: 'orgId is required' });
    }

    const result = await organizationService.getOrganizationDetails(orgId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Org Details Controller Error: ${error}`);
    next(error);
  }
};