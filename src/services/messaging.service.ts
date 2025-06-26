import prisma from "src/config/prisma/prisma.client";
import { io } from "src/server";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

// Create a message thread for a board (called when board is created)
export const createMessageThreadForBoard = async (boardId: string) => {
  try {
    const thread = await prisma.messageThread.create({
      data: { boardId },
    });
    return thread;
  } catch (error) {
    logger.error(`Error Creating Message Thread: ${error}`);
    throw new CustomError(500, "Failed to create message thread");
  }
};

// Get the message thread for a board (with messages)
export const getMessageThreadByBoard = async (boardId: string) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { boardId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!thread) throw new CustomError(404, "Message thread not found");
    return thread;
  } catch (error) {
    logger.error(`Error Fetching Message Thread: ${error}`);
    throw new CustomError(500, "Failed to fetch message thread");
  }
};

// Send a message in a thread (board chat)
export const sendMessage = async ({
  boardId,
  senderId,
  text,
}: {
  boardId: string;
  senderId: string;
  text: string;
}) => {
  try {
    // Find or create the thread
    let thread = await prisma.messageThread.findUnique({ where: { boardId } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { boardId } });
    }
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId,
        text,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    io.to(`board_${boardId}`).emit("newMessage", {
      id: message.id,
      senderId: message.sender.id,
      text: message.text,
    });
    return message;
  } catch (error) {
    logger.error(`Error Sending Message: ${error}`);
    throw new CustomError(500, "Failed to send message");
  }
};

// Get all messages for a board (by thread)
export const getMessagesForBoard = async (
  boardId: string,
  { skip = 0, take = 20, cursor }: { skip?: number; take?: number; cursor?: string }
) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { boardId },
    });
    if (!thread) throw new CustomError(404, "Message thread not found");

    const messages = await prisma.message.findMany({
      where: { threadId: thread.id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // skip the cursor itself
          }
        : {}),
    });

    return messages;
  } catch (error) {
    logger.error(`Error Fetching Paginated Messages: ${error}`);
    throw new CustomError(500, "Failed to fetch messages");
  }
};