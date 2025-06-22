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
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate request params
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      // Validate request query
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable message
        const errorMessages = error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        logger.error(`Validation Error: ${errorMessages}`);

        // Use CustomError to maintain consistent error structure
        const customError = new CustomError(
          400,
          `Validation failed: ${errorMessages}`
        );

        next(customError);
      } else {
        logger.error(`Unexpected Validation Error: ${error}`);
        next(new CustomError(500, "Internal validation error"));
      }
    }
  };
};
