import prisma from "../config/prisma/prisma.client";
import { Request, Response, NextFunction } from "express";

export const injectOrganizationIdFromBoard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { boardId } = req.params;
  if (!boardId) {
    return res.status(400).json({ success: false, message: "Missing boardId" });
  }
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return res.status(404).json({ success: false, message: "Board not found" });
  }
  req.params.organizationId = board.organizationId;
  next();
};
