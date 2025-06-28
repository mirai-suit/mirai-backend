import { Request, Response, NextFunction } from "express";
import * as noteService from "../services/note.service";
import logger from "src/utils/logger";
import type {
  CreateNoteResponseDto,
  GetNoteResponseDto,
  GetNotesResponseDto,
  UpdateNoteResponseDto,
  DeleteNoteResponseDto,
} from "src/interfaces/DTOs/note/response.dto";

// Create a new note
export const createNote = async (
  req: Request,
  res: Response<CreateNoteResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { boardId } = req.params;
    const result = await noteService.createNote({
      ...req.body,
      boardId: boardId,
      authorId: userId,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Create Note Controller Error: ${error}`);
    next(error);
  }
};

// Get all notes for a board
export const getNotesByBoardId = async (
  req: Request,
  res: Response<GetNotesResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { boardId } = req.params;
    const filters = {
      category: req.query.category as string,
      search: req.query.search as string,
      pinned: req.query.pinned === "true" ? true : req.query.pinned === "false" ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await noteService.getNotesByBoardId(boardId, userId, filters);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Notes Controller Error: ${error}`);
    next(error);
  }
};

// Get a single note by ID
export const getNoteById = async (
  req: Request,
  res: Response<GetNoteResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { noteId } = req.params;
    const result = await noteService.getNoteById(noteId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Note Controller Error: ${error}`);
    next(error);
  }
};

// Update a note
export const updateNote = async (
  req: Request,
  res: Response<UpdateNoteResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { noteId } = req.params;
    const result = await noteService.updateNote(noteId, userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Update Note Controller Error: ${error}`);
    next(error);
  }
};

// Delete a note
export const deleteNote = async (
  req: Request,
  res: Response<DeleteNoteResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { noteId } = req.params;
    const result = await noteService.deleteNote(noteId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Delete Note Controller Error: ${error}`);
    next(error);
  }
};

// Get notes by category for a board
export const getNotesByCategory = async (
  req: Request,
  res: Response<GetNotesResponseDto>,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "User not authenticated",
      });
      return;
    }

    const { boardId, category } = req.params;
    const filters = {
      category: category,
      search: req.query.search as string,
      pinned: req.query.pinned === "true" ? true : req.query.pinned === "false" ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await noteService.getNotesByBoardId(boardId, userId, filters);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Get Notes by Category Controller Error: ${error}`);
    next(error);
  }
};
