// Response DTOs for Task Attachments

export interface TaskAttachmentDto {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  fileType: "VOICE_NOTE" | "IMAGE" | "DOCUMENT" | "VIDEO" | "OTHER";
  metadata?: {
    duration?: number; // For audio files (in seconds)
    width?: number; // For images
    height?: number; // For images
    pages?: number; // For documents
  };
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  downloadUrl?: string; // Signed URL for download/streaming
  createdAt: string;
  updatedAt: string;
}

export interface UploadAttachmentResponseDto {
  success: boolean;
  message: string;
  data: TaskAttachmentDto;
}

export interface GetAttachmentsResponseDto {
  success: boolean;
  data: TaskAttachmentDto[];
}

export interface DeleteAttachmentResponseDto {
  success: boolean;
  message: string;
}

export interface DownloadAttachmentResponseDto {
  success: boolean;
  downloadUrl: string;
  filename: string;
}
