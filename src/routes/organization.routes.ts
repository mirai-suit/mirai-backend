import { Router } from "express";
import * as organizationController from "../controllers/organization.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  checkOrganizationMembership,
  requireOrganizationPermission,
} from "../middlewares/organization.middleware";

const router = Router();

// Create organization (only requires authentication)
router.post("/create", verifyToken, organizationController.createOrganization);

// Get user's organizations (only requires authentication)
router.get(
  "/my-organizations",
  verifyToken,
  organizationController.getUserOrganizations
);

// Organization-specific routes (require membership check)
router.use("/:organizationId", verifyToken, checkOrganizationMembership);

// Add member (requires inviteUsers permission - ADMIN or EDITOR)
router.post(
  "/:organizationId/add-member",
  requireOrganizationPermission("inviteUsers"),
  organizationController.addMemberToOrganization
);

// Remove member (requires removeUsers permission - ADMIN only)
router.delete(
  "/:organizationId/remove-member",
  requireOrganizationPermission("removeUsers"),
  organizationController.removeMemberFromOrganization
);

// Change user role (requires changeUserRoles permission - ADMIN only)
router.patch(
  "/:organizationId/change-role",
  requireOrganizationPermission("changeUserRoles"),
  organizationController.changeUserRoleInOrganization
);

// Get organization members (all members can view)
router.get(
  "/:organizationId/members",
  organizationController.getOrganizationMembers
);

// Get organization details (all members can view)
router.get("/:organizationId", organizationController.getOrganizationDetails);

export default router;
