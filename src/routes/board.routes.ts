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
  validate({ params: boardParamsSchema }),
  boardController.deleteBoard
);

// Add user access to a board
router.post(
  "/:boardId/access",
  verifyToken,
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
  validate({ params: boardUserParamsSchema }),
  boardController.removeUserFromBoard
);

// Change user's access role on a board
router.put(
  "/:boardId/access/:userId",
  verifyToken,
  validate({
    params: boardUserParamsSchema,
    body: changeBoardRoleSchema,
  }),
  boardController.changeUserBoardRole
);

export default router;
