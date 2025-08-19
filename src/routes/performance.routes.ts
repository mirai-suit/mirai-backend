import { Router } from "express";
import * as performanceController from "../controllers/performance.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Get team performance overview (dashboard)
router.get(
  "/team/:teamId/overview",
  verifyToken,
  performanceController.getTeamPerformanceOverview
);

// Get user performance metrics for a team
router.get(
  "/user/:userId/team/:teamId/metrics",
  verifyToken,
  performanceController.getUserPerformanceMetrics
);

// Get full performance report for a team (dashboard analytics)
router.get(
  "/team/:teamId/report",
  verifyToken,
  performanceController.getPerformanceReport
);

export default router;