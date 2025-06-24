import { z } from "zod";

// Column colors (predefined options)
export const COLUMN_COLORS = [
  "#6B7280", // Gray (default)
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
] as const;

// Create column validation schema
export const createColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name must be less than 50 characters")
    .trim(),
  boardId: z.string().uuid("Invalid board ID"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional()
    .default("#6B7280"),
  order: z.number().int().min(0).optional(),
});

// Update column validation schema
export const updateColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name must be less than 50 characters")
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
  order: z.number().int().min(0).optional(),
});

// Reorder columns validation schema
export const reorderColumnsSchema = z.object({
  boardId: z.string().uuid("Invalid board ID"),
  columnIds: z.array(z.string().uuid("Invalid column ID")).min(1),
});

// Reorder tasks in column validation schema
export const reorderColumnTasksSchema = z.object({
  taskIds: z.array(z.string().uuid("Invalid task ID")).min(1),
});

// Parameter validation schemas
export const columnIdParamSchema = z.object({
  columnId: z.string().uuid("Invalid column ID"),
});

export const boardIdParamSchema = z.object({
  boardId: z.string().uuid("Invalid board ID"),
});

// Update column request body schema (with columnId)
export const updateColumnRequestSchema = z.object({
  columnId: z.string().uuid("Invalid column ID"),
  name: z
    .string()
    .min(1, "Column name is required")
    .max(50, "Column name must be less than 50 characters")
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
});

// Reorder column tasks request body schema (with columnId)
export const reorderColumnTasksRequestSchema = z.object({
  orderedTaskIds: z.array(z.string().uuid("Invalid task ID")).min(1),
});

// Export types
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type UpdateColumnRequestInput = z.infer<
  typeof updateColumnRequestSchema
>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type ReorderColumnTasksInput = z.infer<typeof reorderColumnTasksSchema>;
export type ReorderColumnTasksRequestInput = z.infer<
  typeof reorderColumnTasksRequestSchema
>;
export type ColumnIdParam = z.infer<typeof columnIdParamSchema>;
export type BoardIdParam = z.infer<typeof boardIdParamSchema>;
