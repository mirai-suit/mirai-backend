import { Router } from "express";
import * as teamController from "../controllers/team.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { checkOrganizationMembership } from "../middlewares/organization.middleware";

const router = Router();

// Apply auth middleware to all team routes
router.use(verifyToken);

// Team CRUD Operations
router.post("/", teamController.createTeam);
router.get(
  "/organization/:organizationId",
  checkOrganizationMembership,
  teamController.getTeamsByOrganization
);
router.get(
  "/organization/:organizationId/task-assignment",
  checkOrganizationMembership,
  teamController.getTeamsForTaskAssignment
);
router.get("/:teamId", teamController.getTeamById);
router.put("/:teamId", teamController.updateTeam);
router.delete("/:teamId", teamController.deleteTeam);

// Team Member Management
router.post("/:teamId/members", teamController.addTeamMembers);
router.delete("/:teamId/members/:userId", teamController.removeTeamMember);
router.put(
  "/:teamId/members/:userId/role",
  teamController.updateTeamMemberRole
);

// Team Board Access Management
router.post("/:teamId/boards", teamController.assignBoardsToTeam);
router.delete("/:teamId/boards/:boardId", teamController.removeBoardFromTeam);
router.get("/board/:boardId/teams", teamController.getTeamsByBoardAccess);

// Performance & Analytics Routes
router.get("/:teamId/performance", teamController.getTeamPerformance);
router.get(
  "/:teamId/reports/:period",
  teamController.generatePerformanceReport
);
router.get(
  "/:teamId/members/:userId/performance",
  teamController.getUserPerformanceMetrics
);

// User Teams
router.get("/user/:userId", teamController.getUserTeams);

export default router;
