import multer = require("multer");
import { Request } from "express";
import CustomError from "../shared/exceptions/CustomError";
import {
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from "../services/s3Upload.service";

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Get all allowed file types
  const allAllowedTypes = [
    ...ALLOWED_FILE_TYPES.AUDIO,
    ...ALLOWED_FILE_TYPES.IMAGES,
    ...ALLOWED_FILE_TYPES.DOCUMENTS,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError(400, `File type ${file.mimetype} is not supported`));
  }
};

// Multer configuration for task attachments
export const uploadTaskAttachments = multer({
  storage: multer.memoryStorage(), // Store in memory for S3 upload
  limits: {
    fileSize: Math.max(...Object.values(FILE_SIZE_LIMITS)), // Use the largest limit
    files: 10, // Maximum 10 files per request
  },
  fileFilter,
});

// Multer configuration specifically for voice notes
export const uploadVoiceNote = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.VOICE_NOTE,
    files: 1, // Only one voice note at a time
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (ALLOWED_FILE_TYPES.AUDIO.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError(400, "Only audio files are allowed for voice notes"));
    }
  },
});

// Multer configuration specifically for images
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE,
    files: 5, // Maximum 5 images at once
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (ALLOWED_FILE_TYPES.IMAGES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError(400, "Only image files are allowed"));
    }
  },
});

// Multer configuration specifically for documents
export const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.DOCUMENT,
    files: 3, // Maximum 3 documents at once
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new CustomError(400, "Only document files are allowed"));
    }
  },
});

// Error handling middleware for multer errors
export const handleMulterError = (
  error: any,
  _req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File size too large",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files uploaded",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: "Unexpected file field",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "File upload error",
        });
    }
  }
  next(error);
};
