import { Request, Response, NextFunction } from "express";
import * as messagingService from "../services/messaging.service";
import logger from "src/utils/logger";

// Create a message thread for a board (usually called when board is created)
export const createMessageThreadForBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.body;
    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }
    const thread = await messagingService.createMessageThreadForBoard(boardId);
    res.status(201).json({ success: true, thread });
  } catch (error) {
    logger.error(`Create Message Thread Controller Error: ${error}`);
    next(error);
  }
};

// Get the message thread for a board (with messages)
export const getMessageThreadByBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }
    const thread = await messagingService.getMessageThreadByBoard(boardId);
    res.status(200).json({ success: true, thread });
  } catch (error) {
    logger.error(`Get Message Thread Controller Error: ${error}`);
    next(error);
  }
};

// Send a message in a thread (board chat)
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const { text, replyToId } = req.body;
    const senderId = req.user.id; // Assumes req.user is set by authentication middleware

    if (!boardId || !text) {
      res
        .status(400)
        .json({ success: false, message: "boardId and text are required" });
      return;
    }

    const message = await messagingService.sendMessage({
      boardId,
      senderId,
      text,
      replyToId,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error(`Send Message Controller Error: ${error}`);
    next(error);
  }
};

// Get paginated messages for a board
export const getMessagesForBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const { skip, take, cursor } = req.query;

    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }

    const messages = await messagingService.getMessagesForBoard(boardId, {
      skip: skip ? parseInt(skip as string, 10) : 0,
      take: take ? parseInt(take as string, 10) : 20,
      cursor: cursor as string | undefined,
    });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    logger.error(`Get Messages For Board Controller Error: ${error}`);
    next(error);
  }
};

// Search messages in a board
export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const { q: query, skip, take } = req.query;

    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }

    if (!query || typeof query !== "string") {
      res
        .status(400)
        .json({ success: false, message: 'query parameter "q" is required' });
      return;
    }

    const messages = await messagingService.searchMessages(boardId, query, {
      skip: skip ? parseInt(skip as string, 10) : 0,
      take: take ? parseInt(take as string, 10) : 20,
    });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    logger.error(`Search Messages Controller Error: ${error}`);
    next(error);
  }
};

// Get board users for mentions autocomplete
export const getBoardUsersForMentions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }

    const users = await messagingService.getBoardUsersForMentions(boardId);
    res.status(200).json({ success: true, users });
  } catch (error) {
    logger.error(`Get Board Users Controller Error: ${error}`);
    next(error);
  }
};

// Edit a message
export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!messageId || !text) {
      res
        .status(400)
        .json({ success: false, message: "messageId and text are required" });
      return;
    }

    const message = await messagingService.editMessage(messageId, text, userId);
    res.status(200).json({ success: true, message });
  } catch (error) {
    logger.error(`Edit Message Controller Error: ${error}`);
    next(error);
  }
};

// Delete a message
export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    if (!messageId) {
      res
        .status(400)
        .json({ success: false, message: "messageId is required" });
      return;
    }

    const result = await messagingService.deleteMessage(messageId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Message Controller Error: ${error}`);
    next(error);
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { boardId } = req.params;
    const userId = req.user.id;

    if (!boardId) {
      res.status(400).json({ success: false, message: "boardId is required" });
      return;
    }

    const result = await messagingService.markMessagesAsRead(boardId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Mark Messages as Read Controller Error: ${error}`);
    next(error);
  }
};
