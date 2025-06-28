import { Router } from "express";
import * as noteController from "../controllers/note.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware";
import {
  createNoteSchema,
  updateNoteSchema,
  noteParamsSchema,
  boardNotesParamsSchema,
  noteCategoryParamsSchema,
  noteQuerySchema,
} from "../schemas/note.schema";

const router = Router();

// Create a new note for a board
router.post(
  "/boards/:boardId/notes",
  verifyToken,
  validate({
    body: createNoteSchema.omit({ boardId: true }), // Remove boardId from body validation since it comes from params
    params: boardNotesParamsSchema,
  }),
  noteController.createNote
);

// Get all notes for a board (with optional filters)
router.get(
  "/boards/:boardId/notes",
  verifyToken,
  validate({
    params: boardNotesParamsSchema,
    query: noteQuerySchema.partial(), // Make all query params optional
  }),
  noteController.getNotesByBoardId
);

// Get notes by category for a board
router.get(
  "/boards/:boardId/notes/category/:category",
  verifyToken,
  validate({
    params: noteCategoryParamsSchema,
    query: noteQuerySchema.partial().omit({ category: true }), // Remove category from query since it's in params
  }),
  noteController.getNotesByCategory
);

// Get a single note by ID
router.get(
  "/notes/:noteId",
  verifyToken,
  validate({ params: noteParamsSchema }),
  noteController.getNoteById
);

// Update a note
router.put(
  "/notes/:noteId",
  verifyToken,
  validate({
    params: noteParamsSchema,
    body: updateNoteSchema,
  }),
  noteController.updateNote
);

// Delete a note
router.delete(
  "/notes/:noteId",
  verifyToken,
  validate({ params: noteParamsSchema }),
  noteController.deleteNote
);

export default router;
