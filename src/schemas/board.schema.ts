import { z } from "zod";

// UUID validation helper
const uuidSchema = z.string().uuid("Invalid UUID format");

// Hex color validation helper
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format");

// Create board schema
export const createBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .trim(),
  organizationId: uuidSchema,
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
  color: hexColorSchema.optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  teamId: uuidSchema.optional(),
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  isShared: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  defaultColumns: z
    .array(
      z
        .string()
        .min(1, "Column name cannot be empty")
        .max(50, "Column name must be less than 50 characters")
        .trim()
    )
    .max(10, "Maximum 10 columns allowed")
    .optional(),
});

// Update board schema (boardId comes from params, not body)
export const updateBoardSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
  color: hexColorSchema.optional(),
  coverImage: z.string().url("Invalid cover image URL").optional(),
  teamId: uuidSchema.optional(),
  isArchived: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isTemplate: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  isShared: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// Board params schema (for routes with boardId)
export const boardParamsSchema = z.object({
  boardId: uuidSchema,
});

// Organization params schema (for routes with organizationId)
export const organizationParamsSchema = z.object({
  organizationId: uuidSchema,
});

// Board access schema (boardId from params, access data from body)
export const boardAccessSchema = z.object({
  userId: uuidSchema,
  accessRole: z
    .enum(["MEMBER", "EDITOR", "ADMIN"], {
      errorMap: () => ({
        message: "Access role must be MEMBER, EDITOR, or ADMIN",
      }),
    })
    .optional(),
});

// Board and user params schema (for routes with both boardId and userId)
export const boardUserParamsSchema = z.object({
  boardId: uuidSchema,
  userId: uuidSchema,
});

// Change board role schema (userId comes from params)
export const changeBoardRoleSchema = z.object({
  accessRole: z.enum(["MEMBER", "EDITOR", "ADMIN"], {
    errorMap: () => ({
      message: "Access role must be MEMBER, EDITOR, or ADMIN",
    }),
  }),
});

// Export types for TypeScript
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type BoardParamsInput = z.infer<typeof boardParamsSchema>;
export type OrganizationParamsInput = z.infer<typeof organizationParamsSchema>;
export type BoardAccessInput = z.infer<typeof boardAccessSchema>;
export type BoardUserParamsInput = z.infer<typeof boardUserParamsSchema>;
export type ChangeBoardRoleInput = z.infer<typeof changeBoardRoleSchema>;
