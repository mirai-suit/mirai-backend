import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import { OrganizationRole } from "src/interfaces/enums/organization";
import { sendEmail } from "./email.service";
import {
  generateInvitationEmailTemplate,
  generateInvitationEmailPlainText,
} from "src/templates/email/invitation.template";
import jwt from "jsonwebtoken";
import { addDays } from "date-fns";

// Generate secure invitation token
const generateInvitationToken = (
  email: string,
  organizationId: string,
  role: OrganizationRole
): string => {
  const payload = {
    email,
    organizationId,
    role,
    type: "invitation",
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d", // 7 days expiration
  });
};

// Verify invitation token
export const verifyInvitationToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.type !== "invitation") {
      throw new CustomError(400, "Invalid invitation token");
    }

    return decoded;
  } catch (error) {
    logger.error(`Invalid invitation token: ${error}`);
    throw new CustomError(400, "Invalid or expired invitation token");
  }
};

// Send organization invitation
export const sendOrganizationInvitation = async ({
  email,
  organizationId,
  invitedById,
  role = OrganizationRole.MEMBER,
}: {
  email: string;
  organizationId: string;
  invitedById: string;
  role?: OrganizationRole;
}) => {
  try {
    // Check if user is already a member
    const userByEmail = await getUserIdByEmail(email);
    if (userByEmail) {
      const existingMember = await prisma.organizationUser.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: userByEmail,
          },
        },
      });

      if (existingMember) {
        throw new CustomError(
          400,
          "User is already a member of this organization"
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        email_organizationId: {
          email,
          organizationId,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === "PENDING") {
      throw new CustomError(400, "Invitation already sent to this email");
    }

    // Get organization and inviter details for email
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        creator: true,
      },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: invitedById },
    });

    if (!organization || !inviter) {
      throw new CustomError(404, "Organization or inviter not found");
    }

    // Generate invitation token
    const token = generateInvitationToken(email, organizationId, role);

    // Set expiration date (7 days from now)
    const expiresAt = addDays(new Date(), 7);

    // Create or update invitation
    const invitation = await prisma.invitation.upsert({
      where: {
        email_organizationId: {
          email,
          organizationId,
        },
      },
      update: {
        token,
        status: "PENDING",
        role,
        expiresAt,
        invitedById,
        updatedAt: new Date(),
      },
      create: {
        email,
        organizationId,
        invitedById,
        role,
        token,
        expiresAt,
      },
    });

    // Send invitation email
    const invitationUrl = `${process.env.FRONTEND_URL}/invite/${token}`;

    // Generate beautiful email template
    const emailHtml = generateInvitationEmailTemplate({
      organizationName: organization.name,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      inviteeEmail: email,
      role,
      invitationUrl,
      expirationDays: 7,
    });

    const emailPlainText = generateInvitationEmailPlainText({
      organizationName: organization.name,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      inviteeEmail: email,
      role,
      invitationUrl,
      expirationDays: 7,
    });

    await sendEmail(
      {
        to: email,
        subject: `You're invited to join ${organization.name} on Mirai`,
      },
      {
        html: emailHtml,
        text: emailPlainText,
      }
    );

    logger.info(
      `Invitation sent to ${email} for organization ${organization.name}`
    );

    return {
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    };
  } catch (error) {
    logger.error(`Error sending invitation: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to send invitation");
  }
};

// Accept organization invitation
export const acceptOrganizationInvitation = async (
  token: string,
  userId?: string
) => {
  try {
    // Verify and decode token
    verifyInvitationToken(token);

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      throw new CustomError(404, "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new CustomError(400, "Invitation has already been processed");
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new CustomError(400, "Invitation has expired");
    }

    // If userId is provided, use it. Otherwise, try to find user by email
    let targetUserId = userId;
    if (!targetUserId) {
      const userByEmail = await getUserIdByEmail(invitation.email);
      if (!userByEmail) {
        throw new CustomError(
          400,
          "User account not found. Please create an account first."
        );
      }
      targetUserId = userByEmail;
    }

    // Check if user is already a member
    const existingMember = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: targetUserId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted even if already a member
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
      throw new CustomError(
        400,
        "You are already a member of this organization"
      );
    }

    // Add user to organization
    const organizationUser = await prisma.organizationUser.create({
      data: {
        organizationId: invitation.organizationId,
        userId: targetUserId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    logger.info(
      `User ${targetUserId} accepted invitation to ${invitation.organization.name}`
    );

    return {
      success: true,
      organization: invitation.organization,
      role: invitation.role,
      membership: organizationUser,
    };
  } catch (error) {
    logger.error(`Error accepting invitation: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to accept invitation");
  }
};

// Get invitation details (for invitation page)
export const getInvitationDetails = async (token: string) => {
  try {
    // Verify token first
    verifyInvitationToken(token);

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new CustomError(404, "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new CustomError(400, "Invitation is no longer valid");
    }

    if (new Date() > invitation.expiresAt) {
      throw new CustomError(400, "Invitation has expired");
    }

    return {
      success: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
        },
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      },
    };
  } catch (error) {
    logger.error(`Error getting invitation details: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to get invitation details");
  }
};

// Get pending invitations for an organization
export const getOrganizationInvitations = async (organizationId: string) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        status: "PENDING",
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        invitedBy: inv.invitedBy,
        createdAt: inv.createdAt,
      })),
    };
  } catch (error) {
    logger.error(`Error getting organization invitations: ${error}`);
    throw new CustomError(500, "Failed to get invitations");
  }
};

// Revoke/cancel invitation
export const revokeInvitation = async (
  invitationId: string,
  userId: string
) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new CustomError(404, "Invitation not found");
    }

    // Only the person who sent the invitation or org admin can revoke
    const userRole = await getUserRoleInOrganization(
      userId,
      invitation.organizationId
    );
    if (
      invitation.invitedById !== userId &&
      userRole !== OrganizationRole.ADMIN
    ) {
      throw new CustomError(403, "Not authorized to revoke this invitation");
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    return { success: true };
  } catch (error) {
    logger.error(`Error revoking invitation: ${error}`);
    if (error instanceof CustomError) throw error;
    throw new CustomError(500, "Failed to revoke invitation");
  }
};

// Helper function to get user ID by email
async function getUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id || null;
}

// Helper function to get user role in organization
async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<OrganizationRole | null> {
  const membership = await prisma.organizationUser.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });
  return (membership?.role as OrganizationRole) || null;
}
