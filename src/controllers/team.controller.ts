import { Request, Response, NextFunction } from "express";
import { TeamService } from "../services/team.service";
import { PerformanceService } from "../services/performance.service";
import prisma from "../config/prisma/prisma.client";
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  AssignBoardsToTeamRequest,
  AddTeamMembersRequest,
} from "../interfaces/DTOs/team/request.dto";

const teamService = new TeamService(prisma);
const performanceService = new PerformanceService(prisma);

/**
 * Create a new team
 */
export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data: CreateTeamRequest = req.body;

    // Validate required fields
    if (
      !data.name ||
      !data.leaderId ||
      !data.organizationId ||
      !data.memberIds
    ) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, leaderId, organizationId, memberIds",
      });
      return;
    }

    // Ensure leader is included in members
    if (!data.memberIds.includes(data.leaderId)) {
      data.memberIds.push(data.leaderId);
    }

    const team = await teamService.createTeam(data);

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: { team },
    });
  } catch (error) {
    console.error("Error creating team:", error);
    next(error);
  }
};

/**
 * Get team by ID
 */
export const getTeamById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;

    const team = await teamService.getTeamById(teamId);

    if (!team) {
      res.status(404).json({
        success: false,
        message: "Team not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    next(error);
  }
};

/**
 * Get teams by organization
 */
export const getTeamsByOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await teamService.getTeamsByOrganization(
      organizationId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    next(error);
  }
};

/**
 * Update team
 */
export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const data: UpdateTeamRequest = req.body;

    const team = await teamService.updateTeam(teamId, data);

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      data: { team },
    });
  } catch (error) {
    console.error("Error updating team:", error);
    next(error);
  }
};

/**
 * Assign boards to team
 */
export const assignBoardsToTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const data: AssignBoardsToTeamRequest = req.body;

    if (
      !data.boardIds ||
      !Array.isArray(data.boardIds) ||
      data.boardIds.length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "boardIds array is required and must not be empty",
      });
      return;
    }

    if (!data.grantedBy) {
      res.status(400).json({
        success: false,
        message: "grantedBy is required",
      });
      return;
    }

    await teamService.assignBoardsToTeam(teamId, data);

    res.status(200).json({
      success: true,
      message: "Boards assigned to team successfully",
    });
  } catch (error) {
    console.error("Error assigning boards to team:", error);
    next(error);
  }
};

/**
 * Remove board access from team
 */
export const removeBoardFromTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, boardId } = req.params;

    await teamService.removeBoardFromTeam(teamId, boardId);

    res.status(200).json({
      success: true,
      message: "Board access removed from team successfully",
    });
  } catch (error) {
    console.error("Error removing board access from team:", error);
    next(error);
  }
};

/**
 * Add members to team
 */
export const addTeamMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const data: AddTeamMembersRequest = req.body;

    if (
      !data.memberIds ||
      !Array.isArray(data.memberIds) ||
      data.memberIds.length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "memberIds array is required and must not be empty",
      });
    }

    const members = await teamService.addTeamMembers(teamId, data);

    res.status(200).json({
      success: true,
      message: "Members added to team successfully",
      data: { members },
    });
  } catch (error) {
    console.error("Error adding team members:", error);
    next(error);
  }
};

/**
 * Remove member from team
 */
export const removeTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, userId } = req.params;

    await teamService.removeTeamMember(teamId, userId);

    res.status(200).json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    next(error);
  }
};

/**
 * Update team member role
 */
export const updateTeamMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    if (!role || !["LEADER", "MEMBER"].includes(role)) {
      res.status(400).json({
        success: false,
        message: "Valid role is required (LEADER or MEMBER)",
      });
    }

    const member = await teamService.updateTeamMemberRole(teamId, userId, role);

    res.status(200).json({
      success: true,
      message: "Team member role updated successfully",
      data: { member },
    });
  } catch (error) {
    console.error("Error updating team member role:", error);
    next(error);
  }
};

/**
 * Get user's teams
 */
export const getUserTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const teams = await teamService.getUserTeams(userId);

    res.status(200).json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    next(error);
  }
};

/**
 * Delete team
 */
export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;

    await teamService.deleteTeam(teamId);

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    next(error);
  }
};

/**
 * Get team performance overview
 */
export const getTeamPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const period =
      (req.query.period as "WEEKLY" | "MONTHLY" | "QUARTERLY") || "MONTHLY";

    if (!["WEEKLY", "MONTHLY", "QUARTERLY"].includes(period)) {
      res.status(400).json({
        success: false,
        message: "Invalid period. Must be WEEKLY, MONTHLY, or QUARTERLY",
      });
    }

    const performance = await performanceService.getTeamPerformanceOverview(
      teamId,
      period
    );

    res.status(200).json({
      success: true,
      data: { performance },
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    next(error);
  }
};

/**
 * Generate performance report
 */
export const generatePerformanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId } = req.params;
    const period =
      (req.query.period as "WEEKLY" | "MONTHLY" | "QUARTERLY") || "MONTHLY";

    if (!["WEEKLY", "MONTHLY", "QUARTERLY"].includes(period)) {
      res.status(400).json({
        success: false,
        message: "Invalid period. Must be WEEKLY, MONTHLY, or QUARTERLY",
      });
    }

    const report = await performanceService.generatePerformanceReport(
      teamId,
      period
    );

    res.status(200).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error("Error generating performance report:", error);
    next(error);
  }
};

/**
 * Get user performance metrics
 */
export const getUserPerformanceMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, userId } = req.params;
    const period =
      (req.query.period as "WEEKLY" | "MONTHLY" | "QUARTERLY") || "MONTHLY";

    if (!["WEEKLY", "MONTHLY", "QUARTERLY"].includes(period)) {
      res.status(400).json({
        success: false,
        message: "Invalid period. Must be WEEKLY, MONTHLY, or QUARTERLY",
      });
    }

    const metrics = await performanceService.getUserPerformanceMetrics(
      userId,
      teamId,
      period
    );

    if (!metrics) {
      res.status(404).json({
        success: false,
        message: "Performance metrics not found for this user and team",
      });
    }

    res.status(200).json({
      success: true,
      data: { metrics },
    });
  } catch (error) {
    console.error("Error fetching user performance metrics:", error);
    next(error);
  }
};
