import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import * as authService from '../services/auth.service';
import logger from '../utils/logger';
import { ZodType } from 'zod';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        username: string;
        roles: string[];
        isVerified: boolean;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      res.status(401).json({ message: 'Authentication token is required' });
      return;
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        username: string;
        roles: string[];
        isVerified: boolean;
      };
      
      // Attach user to request with all the payload data
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username,
        roles: decoded.roles,
        isVerified: decoded.isVerified
      };
      
      const user = await authService.findUserById(decoded.id);
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      
      next();
    } catch (error) {
      logger.error(`Token verification failed: ${error}`);
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    logger.error(`Authentication middleware error: ${error}`);
    res.status(500).json({ message: 'Authentication failed' });
    return;
  }
};
// Also fix the checkRole middleware
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(403).json({ message: 'Forbidden' });
      return
    }


    const userRoles = req.user.roles;
    const hasRole = roles.some(role => userRoles.includes(role));
    if (!hasRole) {
      res.status(403).json({ message: 'Forbidden' });
      return
    }
    next();
  };
};



export function validateData(schema: ZodType<any, any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}