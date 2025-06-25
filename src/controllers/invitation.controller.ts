import { Request, Response } from "express";
import * as invitationService from "../services/invitation.service";
import { OrganizationRole } from "../interfaces/enums/organization";
import { OrganizationRequest } from "../middlewares/organization.middleware";
import CustomError from "../shared/exceptions/CustomError";
import logger from "../utils/logger";

// Send organization invitation
export const sendInvitation = async (
  req: OrganizationRequest,
  res: Response
) => {
  try {
    const { organizationId } = req.params;
    const { email, role = OrganizationRole.MEMBER } = req.body;
    const invitedById = req.user?.id;

    if (!invitedById) {
      throw new CustomError(401, "User not authenticated");
    }

    if (!email || typeof email !== "string") {
      throw new CustomError(400, "Valid email is required");
    }

    // Validate role
    if (!Object.values(OrganizationRole).includes(role)) {
      throw new CustomError(400, "Invalid role specified");
    }

    // Additional restriction: Non-admins can only invite as MEMBER
    if (
      req.organizationRole !== OrganizationRole.ADMIN &&
      role !== OrganizationRole.MEMBER
    ) {
      throw new CustomError(
        403,
        "Only administrators can invite users with elevated roles"
      );
    }

    const result = await invitationService.sendOrganizationInvitation({
      email,
      organizationId,
      invitedById,
      role,
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error(`Error in sendInvitation: ${error}`);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

// Get invitation details
export const getInvitationDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new CustomError(400, "Invitation token is required");
    }

    const result = await invitationService.getInvitationDetails(token);
    res.json(result);
  } catch (error) {
    logger.error(`Error in getInvitationDetails: ${error}`);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

// Accept invitation
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user?.id; // May be undefined if user is not logged in

    if (!token) {
      throw new CustomError(400, "Invitation token is required");
    }

    const result = await invitationService.acceptOrganizationInvitation(
      token,
      userId
    );

    res.json(result);
  } catch (error) {
    logger.error(`Error in acceptInvitation: ${error}`);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

// Get organization invitations (pending)
export const getOrganizationInvitations = async (
  req: OrganizationRequest,
  res: Response
) => {
  try {
    const { organizationId } = req.params;

    const result = await invitationService.getOrganizationInvitations(
      organizationId
    );
    res.json(result);
  } catch (error) {
    logger.error(`Error in getOrganizationInvitations: ${error}`);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

// Revoke invitation
export const revokeInvitation = async (
  req: OrganizationRequest,
  res: Response
) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    if (!invitationId) {
      throw new CustomError(400, "Invitation ID is required");
    }

    const result = await invitationService.revokeInvitation(
      invitationId,
      userId
    );
    res.json(result);
  } catch (error) {
    logger.error(`Error in revokeInvitation: ${error}`);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};
