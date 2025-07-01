import AWS = require("aws-sdk");
import { v4 as uuidv4 } from "uuid";
import CustomError from "../shared/exceptions/CustomError";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadFileInput {
  file: Express.Multer.File;
  folder: string; // e.g., 'task-attachments', 'voice-notes'
  taskId?: string;
}

export interface UploadResult {
  s3Key: string;
  s3Url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Upload a single file to S3
 */
export const uploadFile = async (
  data: UploadFileInput
): Promise<UploadResult> => {
  try {
    if (!BUCKET_NAME) {
      throw new CustomError(500, "AWS S3 bucket name not configured");
    }

    // Generate unique filename
    const fileExtension = data.file.originalname.split(".").pop() || "";
    const uniqueFilename = `${data.folder}/${
      data.taskId || "general"
    }/${uuidv4()}.${fileExtension}`;

    // Upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: data.file.buffer,
      ContentType: data.file.mimetype,
      ACL: "private" as const, // Keep files private for security
      Metadata: {
        originalName: data.file.originalname,
        uploadedAt: new Date().toISOString(),
        ...(data.taskId && { taskId: data.taskId }),
      },
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    return {
      s3Key: uniqueFilename,
      s3Url: uploadResult.Location,
      filename: data.file.originalname,
      fileSize: data.file.size,
      mimeType: data.file.mimetype,
    };
  } catch (error) {
    throw new CustomError(500, `Failed to upload file to S3: ${error}`);
  }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFiles = async (
  files: Express.Multer.File[],
  folder: string,
  taskId?: string
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map((file) =>
      uploadFile({ file, folder, taskId })
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new CustomError(500, `Failed to upload multiple files: ${error}`);
  }
};

/**
 * Generate signed URL for secure file access
 */
export const getSignedUrl = async (
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn, // Default 1 hour
    };

    return s3.getSignedUrl("getObject", params);
  } catch (error) {
    throw new CustomError(500, `Failed to generate signed URL: ${error}`);
  }
};

/**
 * Delete file from S3
 */
export const deleteFile = async (s3Key: string): Promise<void> => {
  try {
    await s3
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      })
      .promise();
  } catch (error) {
    throw new CustomError(500, `Failed to delete file from S3: ${error}`);
  }
};

/**
 * Delete multiple files from S3
 */
export const deleteMultipleFiles = async (s3Keys: string[]): Promise<void> => {
  try {
    if (s3Keys.length === 0) return;

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: s3Keys.map((key) => ({ Key: key })),
        Quiet: true,
      },
    };

    await s3.deleteObjects(deleteParams).promise();
  } catch (error) {
    throw new CustomError(500, `Failed to delete files from S3: ${error}`);
  }
};

/**
 * Validate file type and size
 */
export const validateFile = (
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): boolean => {
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new CustomError(400, `File type ${file.mimetype} not allowed`);
  }

  // Check file size
  if (file.size > maxSize) {
    throw new CustomError(400, `File size exceeds limit of ${maxSize} bytes`);
  }

  return true;
};

// File type constants
export const ALLOWED_FILE_TYPES = {
  AUDIO: ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg"],
  IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
  ],
};

export const FILE_SIZE_LIMITS = {
  VOICE_NOTE: 3 * 1024 * 1024, // 3MB (covers ~2 minutes of audio)
  IMAGE: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 3 * 1024 * 1024, // 3MB
};
