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
import { requireOrganizationAdmin } from "../middlewares/organization.middleware";
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

// Add user access to a board
router.post(
  "/:boardId/access",
  verifyToken,
  requireOrganizationAdmin,
  validate({
    params: boardParamsSchema,
    body: boardAccessSchema,
  }),
  boardController.addUserToBoard
);

// Remove user access from a board
router.delete(
  "/:boardId/access/:userId",
  verifyToken,
  requireOrganizationAdmin,
  validate({ params: boardUserParamsSchema }),
  boardController.removeUserFromBoard
);

// Change user's access role on a board
router.put(
  "/:boardId/access/:userId",
  verifyToken,
  requireOrganizationAdmin,
  validate({
    params: boardUserParamsSchema,
    body: changeBoardRoleSchema,
  }),
  boardController.changeUserBoardRole
);

// List all users with access to a board
router.get(
  "/:boardId/access",
  verifyToken,
  requireOrganizationAdmin,
  validate({ params: boardParamsSchema }),
  boardController.getBoardAccessList
);

export default router;
