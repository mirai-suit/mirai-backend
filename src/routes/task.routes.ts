import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Create a new task
router.post('/create', verifyToken, taskController.createTask);

// Get a task by ID
router.get('/:taskId', verifyToken, taskController.getTaskById);

// Get all tasks for a board
router.get('/board/:boardId', verifyToken, taskController.getTasksForBoard);

// Get all tasks for a column
router.get('/column/:columnId', verifyToken, taskController.getTasksForColumn);

// Update a task
router.patch('/update', verifyToken, taskController.updateTask);

// Soft delete a task
router.delete('/delete/:taskId', verifyToken, taskController.deleteTask);

// Assign users to a task
router.post('/assign-users', verifyToken, taskController.assignUsersToTask);

export default router;