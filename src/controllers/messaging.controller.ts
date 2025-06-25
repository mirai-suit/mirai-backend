import { Request, Response, NextFunction } from 'express';
import * as messagingService from '../services/messaging.service';
import logger from 'src/utils/logger';

// Create a message thread for a board (usually called when board is created)
export const createMessageThreadForBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId } = req.body;
    if (!boardId) {
       res.status(400).json({ success: false, message: 'boardId is required' });
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
export const getMessageThreadByBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId } = req.params;
    if (!boardId) {
       res.status(400).json({ success: false, message: 'boardId is required' });
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
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id; // Assumes req.user is set by authentication middleware

    if (!boardId || !text) {
       res.status(400).json({ success: false, message: 'boardId and text are required' });
         return;
    }

    const message = await messagingService.sendMessage({
      boardId,
      senderId,
      text,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error(`Send Message Controller Error: ${error}`);
    next(error);
  }
};

// Get paginated messages for a board
export const getMessagesForBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId } = req.params;
    const { skip, take, cursor } = req.query;

    if (!boardId) {
       res.status(400).json({ success: false, message: 'boardId is required' });
       return;
    }

    const messages = await messagingService.getMessagesForBoard(
      boardId,
      {
        skip: skip ? parseInt(skip as string, 10) : 0,
        take: take ? parseInt(take as string, 10) : 20,
        cursor: cursor as string | undefined,
      }
    );
    res.status(200).json({ success: true, messages });
  } catch (error) {
    logger.error(`Get Messages For Board Controller Error: ${error}`);
    next(error);
  }
};