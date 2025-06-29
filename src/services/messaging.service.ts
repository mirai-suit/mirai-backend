import prisma from "src/config/prisma/prisma.client";
import { io } from "src/server";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

// Helper function to extract mentions from text
const extractMentionsFromText = async (
  text: string,
  boardId: string
): Promise<string[]> => {
  // Extract mentions: @firstName_lastName or @email
  const mentionPattern = /@(\w+(?:_\w+)?|\S+@\S+)/g;
  const mentions = text.match(mentionPattern);

  if (!mentions) return [];

  const mentionedUsers: string[] = [];

  // Get board access list to validate mentions
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      accessList: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!board) return [];

  for (const mention of mentions) {
    const cleanMention = mention.slice(1); // Remove @

    // Find user by firstName_lastName or email
    const user = board.accessList.find((access) => {
      const fullName = `${access.user.firstName}_${access.user.lastName}`;
      return (
        fullName.toLowerCase() === cleanMention.toLowerCase() ||
        access.user.email.toLowerCase() === cleanMention.toLowerCase()
      );
    });

    if (user && !mentionedUsers.includes(user.user.id)) {
      mentionedUsers.push(user.user.id);
    }
  }

  return mentionedUsers;
};

// Helper function to get board users for mentions autocomplete
export const getBoardUsersForMentions = async (boardId: string) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        accessList: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!board) throw new CustomError(404, "Board not found");

    return board.accessList.map((access) => ({
      id: access.user.id,
      name: `${access.user.firstName} ${access.user.lastName}`,
      email: access.user.email,
      avatar: access.user.avatar,
      mentionText: `${access.user.firstName}_${access.user.lastName}`,
    }));
  } catch (error) {
    logger.error(`Error Getting Board Users for Mentions: ${error}`);
    throw new CustomError(500, "Failed to get board users");
  }
};

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
  replyToId,
}: {
  boardId: string;
  senderId: string;
  text: string;
  replyToId?: string;
}) => {
  try {
    // Find or create the thread
    let thread = await prisma.messageThread.findUnique({ where: { boardId } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { boardId } });
    }

    // Extract mentions from message text (@firstName_lastName or @email)
    const mentionedUsers = await extractMentionsFromText(text, boardId);

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId,
        text,
        replyToId,
        mentionedUsers,
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update thread's last message timestamp
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // Emit real-time message
    io.to(`board_${boardId}`).emit("newMessage", {
      id: message.id,
      senderId: message.sender.id,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      text: message.text,
      mentionedUsers: message.mentionedUsers,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            text: message.replyTo.text,
            senderName: `${message.replyTo.sender.firstName} ${message.replyTo.sender.lastName}`,
          }
        : null,
      createdAt: message.createdAt.toISOString(),
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
  {
    skip = 0,
    take = 20,
    cursor,
  }: { skip?: number; take?: number; cursor?: string }
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

// Search messages in a board
export const searchMessages = async (
  boardId: string,
  query: string,
  { skip = 0, take = 20 }: { skip?: number; take?: number } = {}
) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { boardId },
    });

    if (!thread) throw new CustomError(404, "Message thread not found");

    const messages = await prisma.message.findMany({
      where: {
        threadId: thread.id,
        isDeleted: false,
        OR: [
          {
            text: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            sender: {
              OR: [
                {
                  firstName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        ],
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
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
      editedAt: msg.editedAt?.toISOString(),
    }));
  } catch (error) {
    logger.error(`Error Searching Messages: ${error}`);
    throw new CustomError(500, "Failed to search messages");
  }
};

// Edit a message
export const editMessage = async (
  messageId: string,
  newText: string,
  userId: string
) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        thread: {
          select: { boardId: true },
        },
      },
    });

    if (!message) throw new CustomError(404, "Message not found");
    if (message.senderId !== userId)
      throw new CustomError(403, "Not authorized to edit this message");

    // Extract new mentions
    const mentionedUsers = await extractMentionsFromText(
      newText,
      message.thread.boardId!
    );

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: newText,
        mentionedUsers,
        isEdited: true,
        editedAt: new Date(),
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

    // Emit real-time update
    if (message.thread.boardId) {
      io.to(`board_${message.thread.boardId}`).emit("messageEdited", {
        id: updatedMessage.id,
        text: updatedMessage.text,
        mentionedUsers: updatedMessage.mentionedUsers,
        isEdited: true,
        editedAt: updatedMessage.editedAt?.toISOString(),
      });
    }

    return updatedMessage;
  } catch (error) {
    logger.error(`Error Editing Message: ${error}`);
    throw new CustomError(500, "Failed to edit message");
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (messageId: string, userId: string) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        thread: {
          select: { boardId: true },
        },
      },
    });

    if (!message) throw new CustomError(404, "Message not found");
    if (message.senderId !== userId)
      throw new CustomError(403, "Not authorized to delete this message");

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Emit real-time update
    if (message.thread.boardId) {
      io.to(`board_${message.thread.boardId}`).emit("messageDeleted", {
        id: messageId,
      });
    }

    return { success: true, message: "Message deleted successfully" };
  } catch (error) {
    logger.error(`Error Deleting Message: ${error}`);
    throw new CustomError(500, "Failed to delete message");
  }
};

// Handle typing indicators
export const handleTyping = (
  boardId: string,
  userId: string,
  userName: string,
  isTyping: boolean
) => {
  io.to(`board_${boardId}`).emit("userTyping", {
    userId,
    userName,
    isTyping,
  });
};

// Get online users in a board
export const getOnlineUsers = (boardId: string) => {
  const room = io.sockets.adapter.rooms.get(`board_${boardId}`);
  return room ? Array.from(room) : [];
};

// Mark messages as read (update unread count)
export const markMessagesAsRead = async (boardId: string, userId: string) => {
  try {
    const thread = await prisma.messageThread.findUnique({
      where: { boardId },
    });

    if (!thread) throw new CustomError(404, "Message thread not found");

    // Reset unread count for this user (you might want to implement per-user read tracking)
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
    });

    // Emit to other users that this user has read messages
    io.to(`board_${boardId}`).emit("messagesMarkedAsRead", {
      userId,
      boardId,
    });

    return { success: true };
  } catch (error) {
    logger.error(`Error Marking Messages as Read: ${error}`);
    throw new CustomError(500, "Failed to mark messages as read");
  }
};
