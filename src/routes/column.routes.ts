import { Router } from 'express';
import * as columnController from '../controllers/column.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Create a new column
router.post('/create', verifyToken, columnController.createColumn);

// Get all columns for a board (boardId from params)
router.get('/board/:boardId', verifyToken, columnController.getColumnsForBoard);

// Update a column (columnId from body)
router.patch('/update', verifyToken, columnController.updateColumn);

// Delete a column (columnId from params)
router.delete('/delete/:columnId', verifyToken, columnController.deleteColumn);

// Reorder tasks in a column (columnId from params)
router.post('/reorder-tasks/:columnId', verifyToken, columnController.reorderColumnTasks);

export default router;