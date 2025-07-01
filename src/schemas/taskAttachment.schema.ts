import { z } from "zod";

// Attachment type enum - matching Prisma enum
export const AttachmentType = z.enum([
  "VOICE_NOTE",
  "IMAGE",
  "DOCUMENT",
  "VIDEO",
  "OTHER",
]);

// Supported MIME types for different file categories
export const SUPPORTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
];

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  VOICE_NOTE: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  OTHER: 10 * 1024 * 1024, // 10MB
};

// Metadata schema for different file types
export const attachmentMetadataSchema = z
  .object({
    duration: z.number().min(0).optional(), // For audio/video files (in seconds)
    width: z.number().min(1).optional(), // For images
    height: z.number().min(1).optional(), // For images
    pages: z.number().min(1).optional(), // For documents
  })
  .optional();

// Upload attachment schema
export const uploadAttachmentSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

// Get attachments schema
export const getAttachmentsSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

// Delete attachment schema
export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid("Invalid attachment ID"),
});

// Download attachment schema
export const downloadAttachmentSchema = z.object({
  attachmentId: z.string().uuid("Invalid attachment ID"),
});

// Helper function to determine file type from MIME type
export const getFileTypeFromMime = (mimeType: string): string => {
  if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return "VOICE_NOTE";
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return "IMAGE";
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) return "DOCUMENT";
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return "VIDEO";
  return "OTHER";
};

// Helper function to get file size limit based on type
export const getFileSizeLimit = (fileType: string): number => {
  return (
    FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS] ||
    FILE_SIZE_LIMITS.OTHER
  );
};

// Helper function to validate if MIME type is supported
export const isSupportedMimeType = (mimeType: string): boolean => {
  return [
    ...SUPPORTED_AUDIO_TYPES,
    ...SUPPORTED_IMAGE_TYPES,
    ...SUPPORTED_DOCUMENT_TYPES,
    ...SUPPORTED_VIDEO_TYPES,
  ].includes(mimeType);
};

// Type exports
export type AttachmentTypeEnum = z.infer<typeof AttachmentType>;
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type GetAttachmentsInput = z.infer<typeof getAttachmentsSchema>;
export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
export type DownloadAttachmentInput = z.infer<typeof downloadAttachmentSchema>;
export type AttachmentMetadata = z.infer<typeof attachmentMetadataSchema>;
