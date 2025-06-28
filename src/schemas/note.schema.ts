import { z } from "zod";

// UUID validation helper
const uuidSchema = z.string().uuid("Invalid UUID format");

// Note category enum validation
export const noteCategorySchema = z.enum([
  "GENERAL",
  "MEETING_NOTES",
  "IDEAS",
  "DOCUMENTATION",
  "REMINDERS",
]);

// Create note schema
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be less than 5000 characters")
    .trim(),
  category: noteCategorySchema.default("GENERAL"),
  boardId: uuidSchema,
  isPinned: z.boolean().optional().default(false),
});

// Update note schema
export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(5000, "Content must be less than 5000 characters")
    .trim()
    .optional(),
  category: noteCategorySchema.optional(),
  isPinned: z.boolean().optional(),
});

// Note parameters schema
export const noteParamsSchema = z.object({
  noteId: uuidSchema,
});

// Board notes parameters schema
export const boardNotesParamsSchema = z.object({
  boardId: uuidSchema,
});

// Note category filter parameters schema
export const noteCategoryParamsSchema = z.object({
  boardId: uuidSchema,
  category: noteCategorySchema,
});

// Note query schema for filtering and pagination
export const noteQuerySchema = z.object({
  category: noteCategorySchema.optional(),
  search: z.string().max(100).trim().optional(),
  pinned: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === "true";
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100).default(20)),
});
