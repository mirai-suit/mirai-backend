import { PrismaClient, AttachmentType } from "@prisma/client";
import * as s3Service from "./s3Upload.service";
import CustomError from "../shared/exceptions/CustomError";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export interface CreateAttachmentInput {
  taskId: string;
  uploaderId: string;
  files: Express.Multer.File[];
}

export interface AttachmentMetadata {
  duration?: number; // for audio files in seconds
  dimensions?: { width: number; height: number }; // for images
  [key: string]: any;
}

/**
 * Determine attachment type based on MIME type
 */
const getAttachmentType = (mimeType: string): AttachmentType => {
  if (s3Service.ALLOWED_FILE_TYPES.AUDIO.includes(mimeType)) {
    return AttachmentType.VOICE_NOTE;
  }
  if (s3Service.ALLOWED_FILE_TYPES.IMAGES.includes(mimeType)) {
    return AttachmentType.IMAGE;
  }
  if (s3Service.ALLOWED_FILE_TYPES.DOCUMENTS.includes(mimeType)) {
    return AttachmentType.DOCUMENT;
  }
  return AttachmentType.OTHER;
};

/**
 * Get file size limit based on attachment type
 */
const getFileSizeLimit = (attachmentType: AttachmentType): number => {
  switch (attachmentType) {
    case AttachmentType.VOICE_NOTE:
      return s3Service.FILE_SIZE_LIMITS.VOICE_NOTE;
    case AttachmentType.IMAGE:
      return s3Service.FILE_SIZE_LIMITS.IMAGE;
    case AttachmentType.DOCUMENT:
      return s3Service.FILE_SIZE_LIMITS.DOCUMENT;
    default:
      return s3Service.FILE_SIZE_LIMITS.DOCUMENT; // Default to document limit
  }
};

/**
 * Get allowed file types based on attachment type
 */
const getAllowedFileTypes = (attachmentType: AttachmentType): string[] => {
  switch (attachmentType) {
    case AttachmentType.VOICE_NOTE:
      return s3Service.ALLOWED_FILE_TYPES.AUDIO;
    case AttachmentType.IMAGE:
      return s3Service.ALLOWED_FILE_TYPES.IMAGES;
    case AttachmentType.DOCUMENT:
      return s3Service.ALLOWED_FILE_TYPES.DOCUMENTS;
    default:
      return [
        ...s3Service.ALLOWED_FILE_TYPES.AUDIO,
        ...s3Service.ALLOWED_FILE_TYPES.IMAGES,
        ...s3Service.ALLOWED_FILE_TYPES.DOCUMENTS,
      ];
  }
};

/**
 * Create task attachments
 */
export const createTaskAttachments = async (data: CreateAttachmentInput) => {
  try {
    // Validate that task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: {
        assignees: true,
        column: {
          include: {
            board: {
              include: {
                organization: {
                  include: {
                    organizationUser: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found");
    }

    // Check if user has access to the task (assignee or organization member)
    const isAssignee = task.assignees.some(
      (assignee) => assignee.id === data.uploaderId
    );
    const isOrgMember = task.column.board.organization.organizationUser.some(
      (orgUser) => orgUser.userId === data.uploaderId
    );

    if (!isAssignee && !isOrgMember) {
      throw new CustomError(
        403,
        "You do not have permission to upload attachments to this task"
      );
    }

    // Validate and process each file
    const attachmentPromises = data.files.map(async (file) => {
      const attachmentType = getAttachmentType(file.mimetype);
      const allowedTypes = getAllowedFileTypes(attachmentType);
      const sizeLimit = getFileSizeLimit(attachmentType);

      // Validate file
      s3Service.validateFile(file, allowedTypes, sizeLimit);

      // Upload to S3
      const uploadResult = await s3Service.uploadFile({
        file,
        folder: "task-attachments",
        taskId: data.taskId,
      });

      // Extract metadata based on file type
      const metadata: AttachmentMetadata = {};

      // For now, we'll add basic metadata
      // In the future, we can add audio duration extraction, image dimension extraction etc.
      if (attachmentType === AttachmentType.VOICE_NOTE) {
        // TODO: Extract audio duration using a library like node-ffmpeg
        metadata.duration = 0; // Placeholder
      }

      // Create attachment record in database
      return prisma.taskAttachment.create({
        data: {
          taskId: data.taskId,
          uploaderId: data.uploaderId,
          filename: uploadResult.filename,
          s3Key: uploadResult.s3Key,
          s3Url: uploadResult.s3Url,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          fileType: attachmentType,
          metadata: metadata as any, // Prisma Json type
        },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    });

    const attachments = await Promise.all(attachmentPromises);

    logger.info(
      `Created ${attachments.length} attachments for task ${data.taskId}`
    );
    return attachments;
  } catch (error) {
    logger.error(`Error creating task attachments: ${error}`);
    throw error;
  }
};

/**
 * Get attachments for a task
 */
export const getTaskAttachments = async (taskId: string, userId: string) => {
  try {
    // First verify user has access to the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        column: {
          include: {
            board: {
              include: {
                organization: {
                  include: {
                    organizationUser: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new CustomError(404, "Task not found");
    }

    // Check access
    const isAssignee = task.assignees.some(
      (assignee) => assignee.id === userId
    );
    const isOrgMember = task.column.board.organization.organizationUser.some(
      (orgUser) => orgUser.userId === userId
    );

    if (!isAssignee && !isOrgMember) {
      throw new CustomError(
        403,
        "You do not have permission to view attachments for this task"
      );
    }

    // Get attachments
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate signed URLs for secure access
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const signedUrl = await s3Service.getSignedUrl(attachment.s3Key);
        return {
          ...attachment,
          downloadUrl: signedUrl,
        };
      })
    );

    return attachmentsWithUrls;
  } catch (error) {
    logger.error(`Error getting task attachments: ${error}`);
    throw error;
  }
};

/**
 * Delete an attachment
 */
export const deleteTaskAttachment = async (
  attachmentId: string,
  userId: string
) => {
  try {
    // Get attachment with task info
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          include: {
            assignees: true,
            column: {
              include: {
                board: {
                  include: {
                    organization: {
                      include: {
                        organizationUser: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new CustomError(404, "Attachment not found");
    }

    // Check if user can delete (only uploader or org admin can delete)
    const isUploader = attachment.uploaderId === userId;
    const isOrgAdmin =
      attachment.task.column.board.organization.organizationUser.some(
        (orgUser) => orgUser.userId === userId && orgUser.role === "ADMIN"
      );

    if (!isUploader && !isOrgAdmin) {
      throw new CustomError(
        403,
        "You do not have permission to delete this attachment"
      );
    }

    // Delete from S3
    await s3Service.deleteFile(attachment.s3Key);

    // Delete from database
    await prisma.taskAttachment.delete({
      where: { id: attachmentId },
    });

    logger.info(`Deleted attachment ${attachmentId} by user ${userId}`);
  } catch (error) {
    logger.error(`Error deleting attachment: ${error}`);
    throw error;
  }
};

/**
 * Get attachment by ID with download URL
 */
export const getAttachmentById = async (
  attachmentId: string,
  userId: string
) => {
  try {
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        task: {
          include: {
            assignees: true,
            column: {
              include: {
                board: {
                  include: {
                    organization: {
                      include: {
                        organizationUser: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new CustomError(404, "Attachment not found");
    }

    // Check access
    const isAssignee = attachment.task.assignees.some(
      (assignee) => assignee.id === userId
    );
    const isOrgMember =
      attachment.task.column.board.organization.organizationUser.some(
        (orgUser) => orgUser.userId === userId
      );

    if (!isAssignee && !isOrgMember) {
      throw new CustomError(
        403,
        "You do not have permission to access this attachment"
      );
    }

    // Generate signed URL
    const downloadUrl = await s3Service.getSignedUrl(attachment.s3Key);

    return {
      ...attachment,
      downloadUrl,
    };
  } catch (error) {
    logger.error(`Error getting attachment by ID: ${error}`);
    throw error;
  }
};
