import { PrismaClient } from "@prisma/client";
import {
  TaskActivityLogRequest,
  UserPerformanceMetricsResponse,
  TeamPerformanceOverviewResponse,
  PerformanceReportResponse,
} from "../interfaces/DTOs/performance/response.dto";

export class PerformanceService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Track task activity and update performance metrics
   */
  async trackTaskActivity(data: TaskActivityLogRequest): Promise<void> {
    console.log(`🚀 [PERFORMANCE] trackTaskActivity called with:`, {
      taskId: data.taskId,
      userId: data.userId,
      action: data.action,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus
    });

    try {
      // Create activity log
      console.log(`📝 [PERFORMANCE] Creating task activity log...`);
      const activityLog = await this.prisma.taskActivityLog.create({
        data: {
          taskId: data.taskId,
          userId: data.userId,
          action: data.action,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          timeSpent: data.timeSpent,
          notes: data.notes,
        },
      });
      console.log(`✅ [PERFORMANCE] Activity log created with ID: ${activityLog.id}`);

      // Update performance metrics if task status changed
      if (
        data.action === "completed" ||
        data.action === "started" ||
        data.action === "created" ||
        data.action === "reopened"
      ) {
        console.log(`📊 [PERFORMANCE] Action ${data.action} requires metrics update`);
        await this.updateUserPerformanceMetrics(
          data.userId,
          data.taskId,
          data.action
        );
        console.log(`✅ [PERFORMANCE] Metrics update completed for action: ${data.action}`);
      } else {
        console.log(`⏭️ [PERFORMANCE] Action ${data.action} does not require metrics update`);
      }
    } catch (error) {
      console.error(`❌ [PERFORMANCE] Error in trackTaskActivity:`, error);
      throw error;
    }
  }

  /**
   * Update user performance metrics based on task activity
   */
  private async updateUserPerformanceMetrics(
    userId: string,
    taskId: string,
    action: string
  ): Promise<void> {
    console.log(`🔍 [METRICS] updateUserPerformanceMetrics called:`, { userId, taskId, action });

    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignees: true,
          team: true,
        },
      });

      if (!task || !task.team) {
        console.log(`⚠️ [METRICS] Task not found or no team associated:`, { 
          taskFound: !!task, 
          teamFound: !!task?.team,
          taskId: task?.id,
          teamId: task?.teamId 
        });
        
        // If task exists but has no team, let's check if teamId is set
        if (task && task.teamId) {
          console.log(`🔧 [METRICS] Task has teamId ${task.teamId} but team relation not loaded, trying to load team...`);
          
          // Try to fetch the task with team relation
          const taskWithTeam = await this.prisma.task.findUnique({
            where: { id: task.id },
            include: { team: true }
          });
          
          if (taskWithTeam?.team) {
            console.log(`✅ [METRICS] Team found after reload: ${taskWithTeam.team.name}`);
            // Update the task reference to include the team
            task.team = taskWithTeam.team;
          } else {
            console.log(`❌ [METRICS] Task has teamId but team does not exist in database`);
            // Fall through to individual user tracking
          }
        }
        
        // If still no team, use individual user performance tracking
        if (!task?.team) {
          console.log(`🏃‍♂️ [METRICS] Using individual user performance tracking (no team required)`);
          await this.trackIndividualUserPerformance(userId, taskId, action, task);
          return;
        }
      }

      console.log(`📋 [METRICS] Task found: ${task.title} (Team: ${task.team.name})`);

      // Find team member
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId,
          teamId: task.teamId!,
          leftAt: null,
        },
      });

      if (!teamMember) {
        console.log(`⚠️ [METRICS] Team member not found for user ${userId} in team ${task.teamId}`);
        console.log(`🏃‍♂️ [METRICS] User not in team, falling back to individual performance tracking`);
        await this.trackIndividualUserPerformance(userId, taskId, action, task);
        return;
      }

      console.log(`👤 [METRICS] Team member found: ${teamMember.id}`);

      const currentPeriod = this.getCurrentMonthPeriod();
      console.log(`📅 [METRICS] Current period:`, currentPeriod);

      // Get or create performance metrics for current period
      let metrics = await this.prisma.userPerformanceMetrics.findFirst({
        where: {
          userId,
          teamMemberId: teamMember.id,
          period: "MONTHLY",
          periodStart: currentPeriod.start,
          periodEnd: currentPeriod.end,
        },
      });

      if (!metrics) {
        console.log(`📊 [METRICS] Creating new metrics record for current period`);
        metrics = await this.prisma.userPerformanceMetrics.create({
          data: {
            userId,
            teamMemberId: teamMember.id,
            period: "MONTHLY",
            periodStart: currentPeriod.start,
            periodEnd: currentPeriod.end,
          },
        });
        console.log(`✅ [METRICS] New metrics record created: ${metrics.id}`);
      } else {
        console.log(`📊 [METRICS] Existing metrics record found: ${metrics.id}`);
      }

      // Update metrics based on action
      const updates: any = { lastActiveDate: new Date() };

      switch (action) {
        case "created":
          updates.tasksAssigned = { increment: 1 };
          console.log(`📈 [METRICS] Incrementing tasksAssigned`);
          break;
        case "started":
          updates.tasksInProgress = { increment: 1 };
          console.log(`📈 [METRICS] Incrementing tasksInProgress`);
          break;
        case "completed":
          const completionTime = await this.calculateTaskCompletionTime(
            taskId,
            userId
          );
          const isOnTime = task.dueDate ? new Date() <= task.dueDate : true;

          updates.tasksCompleted = { increment: 1 };
          // Only decrement tasksInProgress if it's greater than 0
          if (metrics.tasksInProgress > 0) {
            updates.tasksInProgress = { decrement: 1 };
          }
          updates.totalWorkingMinutes = { increment: completionTime };

          if (isOnTime) {
            updates.tasksCompletedOnTime = { increment: 1 };
          } else {
            updates.tasksCompletedLate = { increment: 1 };
          }
          
          console.log(`📈 [METRICS] Task completion updates:`, {
            tasksCompleted: '+1',
            tasksInProgress: metrics.tasksInProgress > 0 ? '-1' : '0 (already at minimum)',
            totalWorkingMinutes: `+${completionTime}`,
            onTime: isOnTime
          });
          break;
        case "reopened":
          // Task moved back from completed to in progress
          updates.tasksInProgress = { increment: 1 };
          // Only decrement tasksCompleted if it's greater than 0
          if (metrics.tasksCompleted > 0) {
            updates.tasksCompleted = { decrement: 1 };
            // Also decrement the completion type counters
            if (metrics.tasksCompletedOnTime > 0) {
              updates.tasksCompletedOnTime = { decrement: 1 };
            } else if (metrics.tasksCompletedLate > 0) {
              updates.tasksCompletedLate = { decrement: 1 };
            }
          }
          updates.tasksReopened = { increment: 1 };
          
          console.log(`📈 [METRICS] Task reopened updates:`, {
            tasksCompleted: metrics.tasksCompleted > 0 ? '-1' : '0 (already at minimum)',
            tasksInProgress: '+1',
            tasksReopened: '+1'
          });
          break;
      }

      // Update the metrics
      console.log(`💾 [METRICS] Updating metrics with:`, updates);
      const updatedMetrics = await this.prisma.userPerformanceMetrics.update({
        where: { id: metrics.id },
        data: updates,
      });

      console.log(`✅ [METRICS] Metrics updated successfully:`, {
        tasksAssigned: updatedMetrics.tasksAssigned,
        tasksCompleted: updatedMetrics.tasksCompleted,
        tasksInProgress: updatedMetrics.tasksInProgress
      });

      // Recalculate derived metrics
      console.log(`🔄 [METRICS] Recalculating derived metrics...`);
      await this.recalculateMetrics(updatedMetrics.id);
      console.log(`✅ [METRICS] Derived metrics recalculated`);
    } catch (error) {
      console.error(`❌ [METRICS] Error in updateUserPerformanceMetrics:`, error);
      throw error;
    }
  }

  /**
   * Recalculate derived performance metrics
   */
  private async recalculateMetrics(metricsId: string): Promise<void> {
    console.log(`🔄 [RECALCULATE] Starting recalculation for metrics ID: ${metricsId}`);

    const metrics = await this.prisma.userPerformanceMetrics.findUnique({
      where: { id: metricsId },
    });

    if (!metrics) {
      console.log(`⚠️ [RECALCULATE] Metrics not found for ID: ${metricsId}`);
      return;
    }

    console.log(`📊 [RECALCULATE] Current metrics:`, {
      tasksAssigned: metrics.tasksAssigned,
      tasksCompleted: metrics.tasksCompleted,
      tasksInProgress: metrics.tasksInProgress,
      tasksCompletedOnTime: metrics.tasksCompletedOnTime,
      totalWorkingMinutes: metrics.totalWorkingMinutes
    });

    const completionRate =
      metrics.tasksAssigned > 0
        ? (metrics.tasksCompleted / metrics.tasksAssigned) * 100
        : 0;

    const onTimeDeliveryRate =
      metrics.tasksCompleted > 0
        ? (metrics.tasksCompletedOnTime / metrics.tasksCompleted) * 100
        : 0;

    const averageTaskCompletionHours =
      metrics.tasksCompleted > 0
        ? metrics.totalWorkingMinutes / metrics.tasksCompleted / 60
        : 0;

    // Calculate productivity score (0-100)
    const productivityScore = this.calculateProductivityScore({
      completionRate,
      onTimeDeliveryRate,
      averageCompletionHours: averageTaskCompletionHours,
      reopenRate:
        metrics.tasksCompleted > 0
          ? (metrics.tasksReopened / metrics.tasksCompleted) * 100
          : 0,
    });

    console.log(`📈 [RECALCULATE] Calculated derived metrics:`, {
      completionRate: completionRate.toFixed(2) + '%',
      onTimeDeliveryRate: onTimeDeliveryRate.toFixed(2) + '%',
      averageTaskCompletionHours: averageTaskCompletionHours.toFixed(2),
      productivityScore: productivityScore
    });

    const updatedMetrics = await this.prisma.userPerformanceMetrics.update({
      where: { id: metricsId },
      data: {
        completionRate,
        onTimeDeliveryRate,
        averageTaskCompletionHours,
        productivityScore,
      },
    });

    console.log(`✅ [RECALCULATE] Metrics updated successfully:`, {
      id: updatedMetrics.id,
      completionRate: updatedMetrics.completionRate,
      productivityScore: updatedMetrics.productivityScore
    });
  }

  /**
   * Calculate productivity score (MVP formula)
   */
  private calculateProductivityScore(metrics: {
    completionRate: number;
    onTimeDeliveryRate: number;
    averageCompletionHours: number;
    reopenRate: number;
  }): number {
    const completionWeight = 0.4;
    const onTimeWeight = 0.3;
    const speedWeight = 0.2;
    const qualityWeight = 0.1;

    const completionScore = Math.min(metrics.completionRate, 100);
    const onTimeScore = Math.min(metrics.onTimeDeliveryRate, 100);
    const speedScore = Math.max(
      100 - (metrics.averageCompletionHours / 8) * 10,
      0
    ); // 8 hours baseline
    const qualityScore = Math.max(100 - metrics.reopenRate * 10, 0);

    return Math.round(
      completionScore * completionWeight +
        onTimeScore * onTimeWeight +
        speedScore * speedWeight +
        qualityScore * qualityWeight
    );
  }

  /**
   * Get team performance overview
   */
  async getTeamPerformanceOverview(
    teamId: string,
    period: "WEEKLY" | "MONTHLY" | "QUARTERLY" = "MONTHLY"
  ): Promise<TeamPerformanceOverviewResponse> {
    const periodRange = this.getPeriodRange(period);

    const teamMembers = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        leftAt: null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        performanceMetrics: {
          where: {
            period,
            periodStart: { gte: periodRange.start },
            periodEnd: { lte: periodRange.end },
          },
          orderBy: { periodStart: "desc" },
          take: 1,
        },
      },
    });

    const allMetrics = teamMembers.flatMap(
      (member) => member.performanceMetrics
    );

    // Calculate team averages
    const averageCompletionRate =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.completionRate, 0) /
          allMetrics.length
        : 0;

    const averageProductivityScore =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.productivityScore, 0) /
          allMetrics.length
        : 0;

    const averageOnTimeDeliveryRate =
      allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.onTimeDeliveryRate, 0) /
          allMetrics.length
        : 0;

    const totalTasksCompleted = allMetrics.reduce(
      (sum, m) => sum + m.tasksCompleted,
      0
    );
    const totalTasksAssigned = allMetrics.reduce(
      (sum, m) => sum + m.tasksAssigned,
      0
    );

    const activeMembers = allMetrics.filter(
      (m) => m.lastActiveDate && this.isWithinLastWeek(m.lastActiveDate)
    ).length;

    // Prepare member data with trends and ranking
    const membersWithMetrics = teamMembers
      .map((member) => {
        const currentMetrics = member.performanceMetrics[0];
        return {
          user: {
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            avatar: member.user.avatar || undefined,
          },
          metrics: currentMetrics
            ? this.transformMetricsResponse(currentMetrics)
            : null,
          trend: "stable" as "up" | "down" | "stable", // TODO: Calculate actual trend
          rank: 0, // TODO: Calculate ranking
        };
      })
      .filter((m) => m.metrics) as Array<{
      user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      metrics: UserPerformanceMetricsResponse;
      trend: "up" | "down" | "stable";
      rank: number;
    }>;

    // Sort by productivity score and assign ranks
    membersWithMetrics.sort(
      (a, b) =>
        (b.metrics?.productivityScore || 0) -
        (a.metrics?.productivityScore || 0)
    );
    membersWithMetrics.forEach((member, index) => {
      member.rank = index + 1;
    });

    // Generate insights
    const insights = this.generateInsights(allMetrics);

    return {
      teamId,
      period,
      periodStart: periodRange.start,
      periodEnd: periodRange.end,
      averageCompletionRate,
      averageProductivityScore,
      averageOnTimeDeliveryRate,
      totalTasksCompleted,
      totalTasksAssigned,
      activeMembers,
      totalMembers: teamMembers.length,
      members: membersWithMetrics,
      insights,
    };
  }

  /**
   * Get user performance metrics for specific period
   */
  async getUserPerformanceMetrics(
    userId: string,
    teamId: string,
    period: "WEEKLY" | "MONTHLY" | "QUARTERLY" = "MONTHLY"
  ): Promise<UserPerformanceMetricsResponse | null> {
    const periodRange = this.getPeriodRange(period);

    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
        leftAt: null,
      },
    });

    if (!teamMember) return null;

    // First try to find metrics for the exact requested period
    let metrics = await this.prisma.userPerformanceMetrics.findFirst({
      where: {
        userId,
        teamMemberId: teamMember.id,
        period,
        periodStart: { gte: periodRange.start },
        periodEnd: { lte: periodRange.end },
      },
      orderBy: { periodStart: "desc" },
    });

    // If no metrics found for current period, get the most recent metrics for this period type
    if (!metrics) {
      metrics = await this.prisma.userPerformanceMetrics.findFirst({
        where: {
          userId,
          teamMemberId: teamMember.id,
          period,
        },
        orderBy: { periodStart: "desc" },
      });
    }

    return metrics ? this.transformMetricsResponse(metrics) : null;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    teamId: string,
    period: "WEEKLY" | "MONTHLY" | "QUARTERLY" = "MONTHLY"
  ): Promise<PerformanceReportResponse> {
    const teamOverview = await this.getTeamPerformanceOverview(teamId, period);

    // TODO: Implement trends calculation
    const trends = {
      completionRate: [],
      productivityScore: [],
      onTimeDelivery: [],
    };

    // Get top performers
    const topPerformers = teamOverview.members.slice(0, 3).map((member) => ({
      user: member.user,
      score: member.metrics?.productivityScore || 0,
      achievement: this.getAchievementForScore(
        member.metrics?.productivityScore || 0
      ),
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(teamOverview);

    return {
      teamId,
      period,
      generatedAt: new Date(),
      teamOverview,
      trends,
      topPerformers,
      recommendations,
    };
  }

  /**
   * Track individual user performance without team association
   * Creates or uses a special "Individual Performance" team for users working on tasks without teams
   */
  private async trackIndividualUserPerformance(
    userId: string,
    taskId: string,
    action: string,
    task: any
  ): Promise<void> {
    console.log(`👤 [INDIVIDUAL METRICS] Tracking individual performance for user ${userId}`);

    try {
      // Find or create a special "Individual Performance" team for this user's organization
      // We'll extract the organization from the task's board
      const taskWithBoard = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { 
          board: { 
            select: { organizationId: true } 
          } 
        }
      });

      if (!taskWithBoard?.board?.organizationId) {
        console.log(`❌ [INDIVIDUAL METRICS] Cannot determine organization for task ${taskId}`);
        return;
      }

      const organizationId = taskWithBoard.board.organizationId;
      
      // Find or create "Individual Performance" team for this organization
      let individualTeam = await this.prisma.team.findFirst({
        where: {
          name: "Individual Performance",
          organizationId: organizationId,
        },
      });

      if (!individualTeam) {
        console.log(`🏗️ [INDIVIDUAL METRICS] Creating "Individual Performance" team for organization ${organizationId}`);
        individualTeam = await this.prisma.team.create({
          data: {
            name: "Individual Performance",
            description: "Virtual team for tracking individual user performance on tasks without team association",
            organizationId: organizationId,
          },
        });
        console.log(`✅ [INDIVIDUAL METRICS] Created "Individual Performance" team: ${individualTeam.id}`);
      }

      // Find or create team membership for this user
      let teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId,
          teamId: individualTeam.id,
          leftAt: null,
        },
      });

      if (!teamMember) {
        console.log(`🔗 [INDIVIDUAL METRICS] Adding user ${userId} to "Individual Performance" team`);
        teamMember = await this.prisma.teamMember.create({
          data: {
            userId,
            teamId: individualTeam.id,
            role: "MEMBER",
            joinedAt: new Date(),
          },
        });
        console.log(`✅ [INDIVIDUAL METRICS] User added to "Individual Performance" team: ${teamMember.id}`);
      }
      
      const currentPeriod = this.getCurrentMonthPeriod();
      console.log(`📅 [INDIVIDUAL METRICS] Current period:`, currentPeriod);

      // Get or create performance metrics for current period
      let metrics = await this.prisma.userPerformanceMetrics.findFirst({
        where: {
          userId,
          teamMemberId: teamMember.id,
          period: "MONTHLY",
          periodStart: currentPeriod.start,
          periodEnd: currentPeriod.end,
        },
      });

      if (!metrics) {
        console.log(`📊 [INDIVIDUAL METRICS] Creating new individual metrics record`);
        metrics = await this.prisma.userPerformanceMetrics.create({
          data: {
            userId,
            teamMemberId: teamMember.id,
            period: "MONTHLY",
            periodStart: currentPeriod.start,
            periodEnd: currentPeriod.end,
          },
        });
        console.log(`✅ [INDIVIDUAL METRICS] New individual metrics record created: ${metrics.id}`);
      } else {
        console.log(`📊 [INDIVIDUAL METRICS] Existing individual metrics record found: ${metrics.id}`);
      }

      // Update metrics based on action
      const updates: any = { lastActiveDate: new Date() };

      switch (action) {
        case "created":
          updates.tasksAssigned = { increment: 1 };
          console.log(`📈 [INDIVIDUAL METRICS] Incrementing tasksAssigned`);
          break;
        case "started":
          updates.tasksInProgress = { increment: 1 };
          console.log(`📈 [INDIVIDUAL METRICS] Incrementing tasksInProgress`);
          break;
        case "completed":
          const completionTime = await this.calculateTaskCompletionTime(
            taskId,
            userId
          );
          const isOnTime = task?.dueDate ? new Date() <= task.dueDate : true;

          updates.tasksCompleted = { increment: 1 };
          // Only decrement tasksInProgress if it's greater than 0
          if (metrics.tasksInProgress > 0) {
            updates.tasksInProgress = { decrement: 1 };
          }
          updates.totalWorkingMinutes = { increment: completionTime };

          if (isOnTime) {
            updates.tasksCompletedOnTime = { increment: 1 };
          } else {
            updates.tasksCompletedLate = { increment: 1 };
          }
          
          console.log(`📈 [INDIVIDUAL METRICS] Task completion updates:`, {
            tasksCompleted: '+1',
            tasksInProgress: metrics.tasksInProgress > 0 ? '-1' : '0 (already at minimum)',
            totalWorkingMinutes: `+${completionTime}`,
            onTime: isOnTime
          });
          break;
        case "reopened":
          // Task moved back from completed to in progress
          updates.tasksInProgress = { increment: 1 };
          // Only decrement tasksCompleted if it's greater than 0
          if (metrics.tasksCompleted > 0) {
            updates.tasksCompleted = { decrement: 1 };
            // Also decrement the completion type counters
            if (metrics.tasksCompletedOnTime > 0) {
              updates.tasksCompletedOnTime = { decrement: 1 };
            } else if (metrics.tasksCompletedLate > 0) {
              updates.tasksCompletedLate = { decrement: 1 };
            }
          }
          updates.tasksReopened = { increment: 1 };
          
          console.log(`📈 [INDIVIDUAL METRICS] Task reopened updates:`, {
            tasksCompleted: metrics.tasksCompleted > 0 ? '-1' : '0 (already at minimum)',
            tasksInProgress: '+1',
            tasksReopened: '+1'
          });
          break;
      }

      // Update the metrics
      console.log(`💾 [INDIVIDUAL METRICS] Updating individual metrics with:`, updates);
      const updatedMetrics = await this.prisma.userPerformanceMetrics.update({
        where: { id: metrics.id },
        data: updates,
      });

      console.log(`✅ [INDIVIDUAL METRICS] Individual metrics updated successfully:`, {
        tasksAssigned: updatedMetrics.tasksAssigned,
        tasksCompleted: updatedMetrics.tasksCompleted,
        tasksInProgress: updatedMetrics.tasksInProgress
      });

      // Recalculate derived metrics
      console.log(`🔄 [INDIVIDUAL METRICS] Recalculating individual derived metrics...`);
      await this.recalculateMetrics(updatedMetrics.id);
      console.log(`✅ [INDIVIDUAL METRICS] Individual derived metrics recalculated`);
    } catch (error) {
      console.error(`❌ [INDIVIDUAL METRICS] Error in trackIndividualUserPerformance:`, error);
      throw error;
    }
  }

  // Helper methods
  private getCurrentMonthPeriod() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  private getPeriodRange(period: "WEEKLY" | "MONTHLY" | "QUARTERLY") {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "WEEKLY":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case "MONTHLY":
        // Get the current month (August 2025)
        start = new Date(now.getFullYear(), now.getMonth(), 1); // Aug 1, 2025
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Aug 31, 2025
        break;
      case "QUARTERLY":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        end = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
    }

    return { start, end };
  }

  private async calculateTaskCompletionTime(
    taskId: string,
    userId: string
  ): Promise<number> {
    const logs = await this.prisma.taskActivityLog.findMany({
      where: {
        taskId,
        userId,
        action: { in: ["started", "completed"] },
      },
      orderBy: { timestamp: "asc" },
    });

    if (logs.length < 2) return 0;

    const startLog = logs.find((log) => log.action === "started");
    const endLog = logs.find((log) => log.action === "completed");

    if (!startLog || !endLog) return 0;

    return Math.floor(
      (endLog.timestamp.getTime() - startLog.timestamp.getTime()) / 60000
    ); // minutes
  }

  private isWithinLastWeek(date: Date): boolean {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
  }

  private transformMetricsResponse(
    metrics: any
  ): UserPerformanceMetricsResponse {
    return {
      id: metrics.id,
      period: metrics.period,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd,
      tasksAssigned: metrics.tasksAssigned,
      tasksCompleted: metrics.tasksCompleted,
      tasksInProgress: metrics.tasksInProgress,
      tasksOverdue: metrics.tasksOverdue,
      totalWorkingMinutes: metrics.totalWorkingMinutes,
      averageTaskCompletionHours: metrics.averageTaskCompletionHours,
      tasksCompletedOnTime: metrics.tasksCompletedOnTime,
      tasksCompletedLate: metrics.tasksCompletedLate,
      tasksReopened: metrics.tasksReopened,
      lastActiveDate: metrics.lastActiveDate,
      activeDaysInPeriod: metrics.activeDaysInPeriod,
      completionRate: metrics.completionRate,
      onTimeDeliveryRate: metrics.onTimeDeliveryRate,
      productivityScore: metrics.productivityScore,
      createdAt: metrics.createdAt,
      updatedAt: metrics.updatedAt,
    };
  }

  private generateInsights(metrics: any[]): Array<{
    type: "positive" | "warning" | "negative";
    title: string;
    description: string;
    actionRequired?: boolean;
  }> {
    const insights = [];

    if (metrics.length === 0) {
      insights.push({
        type: "warning" as const,
        title: "No Performance Data",
        description: "No performance metrics available for this period.",
        actionRequired: false,
      });
      return insights;
    }

    const avgProductivity =
      metrics.reduce((sum, m) => sum + m.productivityScore, 0) / metrics.length;
    const avgCompletion =
      metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length;

    if (avgProductivity >= 80) {
      insights.push({
        type: "positive" as const,
        title: "Excellent Team Performance",
        description: `Team productivity score is ${avgProductivity.toFixed(
          1
        )}, which is excellent!`,
        actionRequired: false,
      });
    } else if (avgProductivity < 60) {
      insights.push({
        type: "negative" as const,
        title: "Team Performance Needs Attention",
        description: `Team productivity score is ${avgProductivity.toFixed(
          1
        )}. Consider providing additional support.`,
        actionRequired: true,
      });
    }

    if (avgCompletion < 70) {
      insights.push({
        type: "warning" as const,
        title: "Low Task Completion Rate",
        description: `Task completion rate is ${avgCompletion.toFixed(
          1
        )}%. Consider reviewing workload distribution.`,
        actionRequired: true,
      });
    }

    return insights;
  }

  private getAchievementForScore(score: number): string {
    if (score >= 90) return "Top Performer";
    if (score >= 80) return "High Performer";
    if (score >= 70) return "Good Performer";
    if (score >= 60) return "Average Performer";
    return "Needs Improvement";
  }

  private generateRecommendations(
    overview: TeamPerformanceOverviewResponse
  ): Array<{
    category: "training" | "workload" | "recognition" | "support";
    message: string;
    priority: "high" | "medium" | "low";
    targetUsers?: string[];
  }> {
    const recommendations = [];

    // Recognition for top performers
    const topPerformers = overview.members.filter(
      (m) => (m.metrics?.productivityScore || 0) >= 80
    );
    if (topPerformers.length > 0) {
      recommendations.push({
        category: "recognition" as const,
        message: `Recognize top performers: ${topPerformers
          .map((p) => `${p.user.firstName} ${p.user.lastName}`)
          .join(", ")}`,
        priority: "medium" as const,
        targetUsers: topPerformers.map((p) => p.user.id),
      });
    }

    // Support for low performers
    const lowPerformers = overview.members.filter(
      (m) => (m.metrics?.productivityScore || 0) < 60
    );
    if (lowPerformers.length > 0) {
      recommendations.push({
        category: "support" as const,
        message: `Provide additional support and training for team members with low productivity scores`,
        priority: "high" as const,
        targetUsers: lowPerformers.map((p) => p.user.id),
      });
    }

    // Workload balancing
    if (overview.averageCompletionRate < 70) {
      recommendations.push({
        category: "workload" as const,
        message:
          "Consider redistributing tasks to balance workload across team members",
        priority: "high" as const,
      });
    }

    return recommendations;
  }
}
