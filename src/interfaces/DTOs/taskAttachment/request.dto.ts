// Request DTOs for Task Attachments
export interface UploadAttachmentRequestDto {
  taskId: string;
}

export interface GetAttachmentsRequestDto {
  taskId: string;
}

export interface DeleteAttachmentRequestDto {
  attachmentId: string;
}

export interface DownloadAttachmentRequestDto {
  attachmentId: string;
}
