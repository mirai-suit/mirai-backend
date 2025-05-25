import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import logger from "src/utils/logger";
import CustomError from "../shared/exceptions/CustomError";
import NotFoundException from "../shared/exceptions/NotFoundException";

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`An error occurred in ${req.method} ${req.path}:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    if (firstError.message.includes("Required")) {
      res.status(400).json({ message: `Missing required field: ${firstError.path}` });
      return;
    }
    res.status(400).json({ message: firstError.message });
    return;
  }

  // Handle custom not found errors
  if (error instanceof NotFoundException) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  // Handle other custom errors
  if (error instanceof CustomError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      res.status(400).json({
        message: `The provided id(s) needed to create ${error.meta?.modelName} was not found`,
      });
      return;
    }

    if (error.code === "P2002") {
      res.status(400).json({
        message: `The following field(s) used to create ${error.meta?.modelName} is/are already taken: ${error.meta?.target}`,
      });
      return;
    }

    res.status(400).json({
      message: error.meta?.cause ?? error.message,
    });
    return;
  }

  // Handle other Prisma error types
  if (
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const errorMessage = getErrorMessageFromPrismaError(error.message);
    res.status(400).json({ message: errorMessage });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(500).json({
      message: "Unable to reach the database server",
    });
    return;
  }

  // Handle generic errors
  if (error instanceof Error) {
    res.status(500).json({
      message: error.message,
      error: "Something went wrong",
    });
    return;
  }

  // Fallback for unknown error types
  res.status(500).json({
    message: "An unknown error occurred",
    error: "Internal Server Error",
  });
}

function getErrorMessageFromPrismaError(error: string): string {
  const errorMessageParts = error.split("\n");
  return errorMessageParts[errorMessageParts.length - 1];
}