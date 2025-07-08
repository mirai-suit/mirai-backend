import { Router } from "express";
import * as boardController from "../controllers/board.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createBoardSchema,
  updateBoardSchema,
  boardParamsSchema,
  organizationParamsSchema,
  boardAccessSchema,
  boardUserParamsSchema,
  changeBoardRoleSchema,
} from "../schemas/board.schema";
import {
  checkOrganizationMembership,
  requireOrganizationAdmin,
} from "../middlewares/organization.middleware";
import { injectOrganizationIdFromBoard } from "../middlewares/boardToOrganization.middleware";
import { requireBoardAccess } from "../middlewares/boardAccess.middleware";

const router = Router();

// Create a new board
router.post(
  "/create",
  verifyToken,
  validate({ body: createBoardSchema }),
  boardController.createBoard
);

// Get a board by ID
router.get(
  "/:boardId",
  verifyToken,
  requireBoardAccess,
  validate({ params: boardParamsSchema }),
  boardController.getBoardById
);

// Get all boards for an organization
router.get(
  "/organization/:organizationId",
  verifyToken,
  validate({ params: organizationParamsSchema }),
  boardController.getBoardsForOrganization
);

// Update a board (PUT for updates with boardId in params)
router.put(
  "/:boardId",
  verifyToken,
  requireBoardAccess,
  validate({
    params: boardParamsSchema,
    body: updateBoardSchema,
  }),
  boardController.updateBoard
);

// Delete a board
router.delete(
  "/:boardId",
  verifyToken,
  requireBoardAccess,
  validate({ params: boardParamsSchema }),
  boardController.deleteBoard
);

// Add user access to a board (RESTful: /board/:boardId/organization/:organizationId/access)
router.post(
  "/:boardId/organization/:organizationId/access",
  verifyToken,
  checkOrganizationMembership,
  requireOrganizationAdmin,
  validate({
    params: boardParamsSchema.merge(organizationParamsSchema),
    body: boardAccessSchema,
  }),
  boardController.addUserToBoard
);

// Remove user access from a board
router.delete(
  "/:boardId/organization/:organizationId/access/:userId",
  verifyToken,
  checkOrganizationMembership,
  requireOrganizationAdmin,
  validate({ params: boardUserParamsSchema.merge(organizationParamsSchema) }),
  boardController.removeUserFromBoard
);

// Change user's access role on a board
router.put(
  "/:boardId/organization/:organizationId/access/:userId",
  verifyToken,
  checkOrganizationMembership,
  requireOrganizationAdmin,
  validate({
    params: boardUserParamsSchema.merge(organizationParamsSchema),
    body: changeBoardRoleSchema,
  }),
  boardController.changeUserBoardRole
);

// List all users with access to a board
const boardOrgParamsSchema = boardParamsSchema.merge(organizationParamsSchema);
router.get(
  "/:boardId/organization/:organizationId/access",
  verifyToken,
  checkOrganizationMembership,
  requireOrganizationAdmin,
  validate({ params: boardOrgParamsSchema }),
  async (req, res, next) => {
    // Extra security: check board belongs to org
    const { organizationId, boardId } = req.params;
    const board = await (
      await import("../config/prisma/prisma.client")
    ).default.board.findUnique({ where: { id: boardId } });
    if (!board || board.organizationId !== organizationId) {
      res.status(403).json({
        success: false,
        message: "Board does not belong to this organization",
      });
      return;
    }
    await (
      await import("../controllers/board.controller")
    ).getBoardAccessList(req, res, next);
  }
);

export default router;
