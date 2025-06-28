import { Router } from "express";
import * as columnController from "../controllers/column.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createColumnSchema,
  updateColumnRequestSchema,
  reorderColumnTasksRequestSchema,
  reorderColumnsSchema,
  columnIdParamSchema,
  boardIdParamSchema,
} from "../schemas/column.schema";

const router = Router();

// Create a new column
router.post(
  "/create",
  verifyToken,
  validate({ body: createColumnSchema }),
  columnController.createColumn
);

// Get all columns for a board (boardId from params)
router.get(
  "/board/:boardId",
  verifyToken,
  validate({ params: boardIdParamSchema }),
  columnController.getColumnsForBoard
);

// Update a column (columnId and updates from body)
router.patch(
  "/update",
  verifyToken,
  validate({ body: updateColumnRequestSchema }),
  columnController.updateColumn
);

// Delete a column (columnId from params)
router.delete(
  "/delete/:columnId",
  verifyToken,
  validate({ params: columnIdParamSchema }),
  columnController.deleteColumn
);

// Reorder tasks in a column (columnId from params, orderedTaskIds from body)
router.post(
  "/reorder-tasks/:columnId",
  verifyToken,
  validate({
    params: columnIdParamSchema,
    body: reorderColumnTasksRequestSchema,
  }),
  columnController.reorderColumnTasks
);

// Reorder columns in a board
router.put(
  "/reorder",
  verifyToken,
  validate({ body: reorderColumnsSchema }),
  columnController.reorderColumns
);

export default router;
