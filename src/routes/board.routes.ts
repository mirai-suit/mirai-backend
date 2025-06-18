import { Router } from 'express';
import * as boardController from '../controllers/board.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Create a new board
router.post('/create', verifyToken, boardController.createBoard);

// Get a board by ID
router.get('/:boardId', verifyToken, boardController.getBoardById);

// Get all boards for an organization
router.get('/organization/:organizationId', verifyToken, boardController.getBoardsForOrganization);

// Update a board (PATCH for partial updates)
router.patch('/update', verifyToken, boardController.updateBoard);

// Delete a board
router.delete('/delete/:boardId', verifyToken, boardController.deleteBoard);

// Add user access to a board
router.post('/add-user', verifyToken, boardController.addUserToBoard);

// Remove user access from a board
router.delete('/remove-user', verifyToken, boardController.removeUserFromBoard);

// Change user's access role on a board
router.patch('/change-user-role', verifyToken, boardController.changeUserBoardRole);

export default router;