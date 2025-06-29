import { Router } from "express";
import * as messagingController from "../controllers/messaging.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Send a message to a thread (board)
router.post("/:boardId/messages", verifyToken, messagingController.sendMessage);

// Get paginated messages for a thread (board)
router.get(
  "/:boardId/messages",
  verifyToken,
  messagingController.getMessagesForBoard
);

// Search messages in a board
router.get(
  "/:boardId/messages/search",
  verifyToken,
  messagingController.searchMessages
);

// Get board users for mentions autocomplete
router.get(
  "/:boardId/users/mentions",
  verifyToken,
  messagingController.getBoardUsersForMentions
);

// Edit a message
router.put(
  "/messages/:messageId",
  verifyToken,
  messagingController.editMessage
);

// Delete a message
router.delete(
  "/messages/:messageId",
  verifyToken,
  messagingController.deleteMessage
);

// Mark messages as read
router.post(
  "/:boardId/messages/read",
  verifyToken,
  messagingController.markMessagesAsRead
);

export default router;
