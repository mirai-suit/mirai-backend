import { Request, Response, NextFunction } from "express";
import prisma from "src/config/prisma/prisma.client";

// Middleware to check if user has access to a board
export const requireBoardAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.id;
  const boardId = req.params.boardId;

  if (!userId || !boardId) {
    res.status(400).json({ message: "Missing user or board ID" });
    return;
  }

  const access = await prisma.boardAccess.findUnique({
    where: { userId_boardId: { userId, boardId } },
  });

  if (!access) {
    res.status(403).json({ message: "Forbidden: No board access" });
    return;
  }

  next();
};
