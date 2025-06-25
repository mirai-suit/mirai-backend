import { z } from "zod";

// Task status enum - matching Prisma enum
export const TaskStatus = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "UNDER_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "CUSTOM",
]);

// Task priority enum - matching Prisma enum
export const TaskPriority = z.enum([
  "LOWEST",
  "LOW",
  "MEDIUM",
  "HIGH",
  "HIGHEST",
]);

// Base task schema for common fields
export const baseTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  status: TaskStatus.default("NOT_STARTED"),
  customStatus: z.string().max(50, "Custom status too long").optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.default("MEDIUM"),
  order: z.number().int().min(0).default(0),
  isRecurring: z.boolean().default(false),
});

// Create task schema
export const createTaskSchema = baseTaskSchema.extend({
  boardId: z.string().uuid("Invalid board ID"),
  columnId: z.string().uuid("Invalid column ID"),
  teamId: z.string().uuid("Invalid team ID").optional(),
  assigneeIds: z
    .array(z.string().uuid("Invalid user ID"))
    .optional()
    .default([]),
});

// Update task schema - all fields optional except ID
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: TaskStatus.optional(),
  customStatus: z.string().max(50, "Custom status too long").optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.optional(),
  order: z.number().int().min(0).optional(),
  isRecurring: z.boolean().optional(),
  columnId: z.string().uuid("Invalid column ID").optional(),
  teamId: z.string().uuid("Invalid team ID").optional(),
  assigneeIds: z.array(z.string().uuid("Invalid user ID")).optional(),
});

// Move task schema (for drag and drop)
export const moveTaskSchema = z.object({
  sourceColumnId: z.string().uuid("Invalid source column ID"),
  targetColumnId: z.string().uuid("Invalid target column ID"),
  newOrder: z.number().int().min(0, "Order must be non-negative"),
});

// Assign users schema
export const assignUsersSchema = z.object({
  userIds: z
    .array(z.string().uuid("Invalid user ID"))
    .min(1, "At least one user must be assigned"),
});

// Get tasks filters schema
export const getTasksFilterSchema = z.object({
  boardId: z.string().uuid("Invalid board ID").optional(),
  columnId: z.string().uuid("Invalid column ID").optional(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  dueDate: z.string().datetime().optional(),
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform(Number)
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().max(255, "Search term too long").optional(),
});

// Param validation schemas
export const taskIdParamSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

export const boardIdParamSchema = z.object({
  boardId: z.string().uuid("Invalid board ID"),
});

export const columnIdParamSchema = z.object({
  columnId: z.string().uuid("Invalid column ID"),
});

// Export types
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type AssignUsersInput = z.infer<typeof assignUsersSchema>;
export type GetTasksFilterInput = z.infer<typeof getTasksFilterSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type BoardIdParam = z.infer<typeof boardIdParamSchema>;
export type ColumnIdParam = z.infer<typeof columnIdParamSchema>;
