import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import CustomError from "src/shared/exceptions/CustomError";
import logger from "src/utils/logger";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        // Fix here: don't assign directly if req.query is read-only
        const parsedQuery = schemas.query.parse(req.query);
        Object.assign(req.query, parsedQuery); // ✅ This updates the object safely
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        logger.error(`Validation Error: ${errorMessages}`);
        return next(
          new CustomError(400, `Validation failed: ${errorMessages}`)
        );
      }

      logger.error(`Unexpected Validation Error: ${error}`);
      return next(new CustomError(500, "Internal validation error"));
    }
  };
};
