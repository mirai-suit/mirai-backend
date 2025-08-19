import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { PerformanceService } from "../services/performance.service";

// Instantiate the service with Prisma
const prisma = new PrismaClient();
const performanceService = new PerformanceService(prisma);

// Get team performance overview (for dashboard)
export const getTeamPerformanceOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const { period } = req.query as { period?: "WEEKLY" | "MONTHLY" | "QUARTERLY" };
    const overview = await performanceService.getTeamPerformanceOverview(
      teamId,
      period || "MONTHLY"
    );
    res.status(200).json({ success: true, overview });
  } catch (error) {
    next(error);
  }
};

// Get user performance metrics for a team
export const getUserPerformanceMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, teamId } = req.params;
    const { period } = req.query as { period?: "WEEKLY" | "MONTHLY" | "QUARTERLY" };
    const metrics = await performanceService.getUserPerformanceMetrics(
      userId,
      teamId,
      period || "MONTHLY"
    );
    res.status(200).json({ success: true, metrics });
  } catch (error) {
    next(error);
  }
};

// Get full performance report for a team (dashboard analytics)
export const getPerformanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const { period } = req.query as { period?: "WEEKLY" | "MONTHLY" | "QUARTERLY" };
    const report = await performanceService.generatePerformanceReport(
      teamId,
      period || "MONTHLY"
    );
    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};