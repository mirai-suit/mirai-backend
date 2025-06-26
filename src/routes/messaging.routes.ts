import { Router } from 'express';
import * as messagingController  from '../controllers/messaging.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Send a message to a thread (board)
router.post(
  '/:boardId/messages',
  verifyToken,
  messagingController.sendMessage
);

// Get paginated messages for a thread (board)
router.get(
  '/:boardId/messages',
  verifyToken,
  messagingController.getMessagesForBoard
);

export default router;