import { Router } from "express";
import * as invitationController from "../controllers/invitation.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Get invitation details (public - no auth required)
router.get("/:token", invitationController.getInvitationDetails);

// Accept invitation (public - handles both authenticated and unauthenticated users)
router.post(
  "/:token/accept",
  verifyToken,
  invitationController.acceptInvitation
);

export default router;
