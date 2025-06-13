import { z } from "zod";

// Base user schema
export const userSchema = z.object({
  id: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  roles: z
    .array(z.string())
    .refine(
      (data) => data.every((role) => role in ["MEMBER", "ADMIN", "EDITOR"]),
      {
        message: "Role must be either from 'MEMBER' , 'ADMIN' or 'EDITOR'",
      }
    )
    .default(["MEMBER"]),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  avatar: z.string().or(z.null()),
  preferencesId: z.string().or(z.null()),
  organizations: z.array(z.string()).or(z.null()),
  teams: z.array(z.string()).or(z.null()),
  boardAccess: z.array(z.string()).or(z.null()),
  tasks: z.array(z.string()).or(z.null()),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Verification code schema
export const verificationCodeSchema = z.object({
  code: z.string().length(4, "Verification code must be 4 digits"),
  email: z.string().email("Invalid email address").or(z.null()),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
});

// Password reset schema
export const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
