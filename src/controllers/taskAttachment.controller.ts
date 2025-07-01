import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import * as taskAttachmentService from "../services/taskAttachment.service";
import CustomError from "../shared/exceptions/CustomError";

/**
 * Upload attachments to a task
 * @route POST /api/tasks/:taskId/attachments
 */
export const uploadTaskAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No files provided for upload",
      });
      return;
    }

    const attachmentData = {
      taskId,
      uploaderId: userId,
      files: req.files as Express.Multer.File[],
    };

    const attachments = await taskAttachmentService.createTaskAttachments(
      attachmentData
    );

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${attachments.length} attachment(s)`,
      data: attachments,
    });
  } catch (error) {
    logger.error(`Upload task attachments error: ${error}`);
    next(error);
  }
};

/**
 * Get attachments for a task
 * @route GET /api/tasks/:taskId/attachments
 */
export const getTaskAttachments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    const attachments = await taskAttachmentService.getTaskAttachments(
      taskId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Task attachments retrieved successfully",
      data: attachments,
    });
  } catch (error) {
    logger.error(`Get task attachments error: ${error}`);
    next(error);
  }
};

/**
 * Get a specific attachment by ID
 * @route GET /api/attachments/:attachmentId
 */
export const getAttachmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    const attachment = await taskAttachmentService.getAttachmentById(
      attachmentId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Attachment retrieved successfully",
      data: attachment,
    });
  } catch (error) {
    logger.error(`Get attachment by ID error: ${error}`);
    next(error);
  }
};

/**
 * Delete an attachment
 * @route DELETE /api/attachments/:attachmentId
 */
export const deleteTaskAttachment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    await taskAttachmentService.deleteTaskAttachment(attachmentId, userId);

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    logger.error(`Delete attachment error: ${error}`);
    next(error);
  }
};

/**
 * Upload a voice note to a task
 * @route POST /api/tasks/:taskId/voice-note
 */
export const uploadVoiceNote = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const { duration } = req.body; // Duration in seconds from frontend

    if (!userId) {
      throw new CustomError(401, "User not authenticated");
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No voice note file provided",
      });
      return;
    }

    // Add duration to file metadata if provided
    if (duration) {
      req.file.originalname = `voice-note-${Date.now()}.webm`;
    }

    const attachmentData = {
      taskId,
      uploaderId: userId,
      files: [req.file],
    };

    const attachments = await taskAttachmentService.createTaskAttachments(
      attachmentData
    );

    res.status(201).json({
      success: true,
      message: "Voice note uploaded successfully",
      data: attachments[0], // Return the single voice note
    });
  } catch (error) {
    logger.error(`Upload voice note error: ${error}`);
    next(error);
  }
};
