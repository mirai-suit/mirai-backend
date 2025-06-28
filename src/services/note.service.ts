import prisma from "src/config/prisma/prisma.client";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";
import {
  CreateNoteResponseDto,
  GetNoteResponseDto,
  GetNotesResponseDto,
  UpdateNoteResponseDto,
  DeleteNoteResponseDto,
} from "src/interfaces/DTOs/note/response.dto";

// Create a new note
export const createNote = async (data: {
  title: string;
  content: string;
  category: string;
  boardId: string;
  authorId: string;
  isPinned?: boolean;
}): Promise<CreateNoteResponseDto> => {
  try {
    // Check if board exists and user has access
    const board = await prisma.board.findFirst({
      where: {
        id: data.boardId,
        OR: [
          {
            organization: {
              organizationUser: {
                some: {
                  userId: data.authorId,
                },
              },
            },
          },
          {
            accessList: {
              some: {
                userId: data.authorId,
              },
            },
          },
        ],
      },
    });

    if (!board) {
      throw new CustomError(404, "Board not found or access denied");
    }

    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category as any,
        boardId: data.boardId,
        authorId: data.authorId,
        isPinned: data.isPinned || false,
      },
      include: {
        author: {
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

    logger.info(`Note created successfully: ${note.id}`);

    return {
      success: true,
      message: "Note created successfully",
      data: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        boardId: note.boardId,
        authorId: note.authorId,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        author: {
          ...note.author,
          avatar: note.author.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Create Note Service Error: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to create note");
  }
};

// Get all notes for a board
export const getNotesByBoardId = async (
  boardId: string,
  userId: string,
  filters: {
    category?: string;
    search?: string;
    pinned?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<GetNotesResponseDto> => {
  try {
    // Check if user has access to the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          {
            organization: {
              organizationUser: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          {
            accessList: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    if (!board) {
      throw new CustomError(404, "Board not found or access denied");
    }

    const { page = 1, limit = 20, category, search, pinned } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      boardId: boardId,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (pinned !== undefined) {
      where.isPinned = pinned;
    }

    // Get total count
    const total = await prisma.note.count({ where });

    // Get notes
    const notes = await prisma.note.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" }, // Pinned notes first
        { createdAt: "desc" }, // Then by creation date
      ],
      skip,
      take: limit,
    });

    logger.info(`Retrieved ${notes.length} notes for board: ${boardId}`);

    return {
      success: true,
      message: "Notes retrieved successfully",
      data: {
        notes: notes.map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          category: note.category,
          boardId: note.boardId,
          authorId: note.authorId,
          isPinned: note.isPinned,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
          author: {
            ...note.author,
            avatar: note.author.avatar || undefined,
          },
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    logger.error(`Get Notes Service Error: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to retrieve notes");
  }
};

// Get a single note by ID
export const getNoteById = async (
  noteId: string,
  userId: string
): Promise<GetNoteResponseDto> => {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        board: {
          OR: [
            {
              organization: {
                organizationUser: {
                  some: {
                    userId: userId,
                  },
                },
              },
            },
            {
              accessList: {
                some: {
                  userId: userId,
                },
              },
            },
          ],
        },
      },
      include: {
        author: {
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

    if (!note) {
      throw new CustomError(404, "Note not found or access denied");
    }

    logger.info(`Note retrieved successfully: ${noteId}`);

    return {
      success: true,
      message: "Note retrieved successfully",
      data: {
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        boardId: note.boardId,
        authorId: note.authorId,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        author: {
          ...note.author,
          avatar: note.author.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Get Note Service Error: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to retrieve note");
  }
};

// Update a note (only by author)
export const updateNote = async (
  noteId: string,
  userId: string,
  data: {
    title?: string;
    content?: string;
    category?: string;
    isPinned?: boolean;
  }
): Promise<UpdateNoteResponseDto> => {
  try {
    // Check if note exists and user is the author
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        authorId: userId,
      },
    });

    if (!existingNote) {
      throw new CustomError(
        404,
        "Note not found or you don't have permission to edit this note"
      );
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category as any }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      },
      include: {
        author: {
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

    logger.info(`Note updated successfully: ${noteId}`);

    return {
      success: true,
      message: "Note updated successfully",
      data: {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        category: updatedNote.category,
        boardId: updatedNote.boardId,
        authorId: updatedNote.authorId,
        isPinned: updatedNote.isPinned,
        createdAt: updatedNote.createdAt.toISOString(),
        updatedAt: updatedNote.updatedAt.toISOString(),
        author: {
          ...updatedNote.author,
          avatar: updatedNote.author.avatar || undefined,
        },
      },
    };
  } catch (error) {
    logger.error(`Update Note Service Error: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to update note");
  }
};

// Delete a note (only by author)
export const deleteNote = async (
  noteId: string,
  userId: string
): Promise<DeleteNoteResponseDto> => {
  try {
    // Check if note exists and user is the author
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        authorId: userId,
      },
    });

    if (!existingNote) {
      throw new CustomError(
        404,
        "Note not found or you don't have permission to delete this note"
      );
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    logger.info(`Note deleted successfully: ${noteId}`);

    return {
      success: true,
      message: "Note deleted successfully",
      data: {
        id: noteId,
      },
    };
  } catch (error) {
    logger.error(`Delete Note Service Error: ${error}`);
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, "Failed to delete note");
  }
};
