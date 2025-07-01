import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import {
  uploadTaskAttachments,
  uploadVoiceNote,
  handleMulterError,
} from "../middlewares/upload.middleware";
import * as taskAttachmentController from "../controllers/taskAttachment.controller";

const router = Router();

// Upload multiple attachments to a task
router.post(
  "/:taskId/attachments",
  verifyToken,
  uploadTaskAttachments.array("attachments", 10), // Allow up to 10 files
  handleMulterError,
  taskAttachmentController.uploadTaskAttachments
);

// Upload a voice note to a task
router.post(
  "/:taskId/voice-note",
  verifyToken,
  uploadVoiceNote.single("voiceNote"),
  handleMulterError,
  taskAttachmentController.uploadVoiceNote
);

// Get all attachments for a task
router.get(
  "/:taskId/attachments",
  verifyToken,
  taskAttachmentController.getTaskAttachments
);

// Get specific attachment by ID
router.get(
  "/attachments/:attachmentId",
  verifyToken,
  taskAttachmentController.getAttachmentById
);

// Delete an attachment
router.delete(
  "/attachments/:attachmentId",
  verifyToken,
  taskAttachmentController.deleteTaskAttachment
);

export default router;
