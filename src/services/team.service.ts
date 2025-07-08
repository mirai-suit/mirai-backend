import { PrismaClient, BoardRole, GrantSource } from "@prisma/client";
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  AssignBoardsToTeamRequest,
  AddTeamMembersRequest,
  TeamResponse,
  TeamsListResponse,
  TeamMemberResponse,
} from "../interfaces/DTOs/team/request.dto";

export class TeamService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new team with leader and members
   */
  async createTeam(data: CreateTeamRequest): Promise<TeamResponse> {
    const team = await this.prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#3B82F6",
        leaderId: data.leaderId,
        organizationId: data.organizationId,
        objectives: data.objectives,
        members: {
          create: data.memberIds.map((userId) => ({
            userId,
            role: userId === data.leaderId ? "LEADER" : "MEMBER",
          })),
        },
      },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        boardAccess: {
          include: {
            board: {
              select: { id: true, title: true, color: true, description: true },
            },
          },
        },
        _count: {
          select: { members: true, boardAccess: true },
        },
      },
    });

    // Assign boards if provided
    if (data.boardIds && data.boardIds.length > 0) {
      await this.assignBoardsToTeam(team.id, {
        boardIds: data.boardIds,
        grantedBy: data.leaderId,
      });
    }

    return this.transformTeamResponse(team);
  }

  /**
   * Get team by ID with all relations
   */
  async getTeamById(teamId: string): Promise<TeamResponse | null> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            performanceMetrics: {
              where: {
                period: "MONTHLY",
                periodStart: {
                  gte: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  ),
                },
              },
              orderBy: { periodStart: "desc" },
              take: 1,
            },
          },
        },
        boardAccess: {
          include: {
            board: {
              select: { id: true, title: true, color: true, description: true },
            },
          },
        },
        _count: {
          select: { members: true, boardAccess: true },
        },
      },
    });

    return team ? this.transformTeamResponse(team) : null;
  }

  /**
   * Get teams by organization with pagination
   */
  async getTeamsByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<TeamsListResponse> {
    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      this.prisma.team.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          organization: {
            select: { id: true, name: true },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          boardAccess: {
            include: {
              board: {
                select: {
                  id: true,
                  title: true,
                  color: true,
                  description: true,
                },
              },
            },
          },
          _count: {
            select: { members: true, boardAccess: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.team.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      teams: teams.map((team) => this.transformTeamResponse(team)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update team information
   */
  async updateTeam(
    teamId: string,
    data: UpdateTeamRequest
  ): Promise<TeamResponse> {
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        boardAccess: {
          include: {
            board: {
              select: { id: true, title: true, color: true, description: true },
            },
          },
        },
        _count: {
          select: { members: true, boardAccess: true },
        },
      },
    });

    return this.transformTeamResponse(team);
  }

  /**
   * Assign boards to team
   */
  async assignBoardsToTeam(
    teamId: string,
    data: AssignBoardsToTeamRequest
  ): Promise<void> {
    // Create team board access
    await this.prisma.teamBoardAccess.createMany({
      data: data.boardIds.map((boardId) => ({
        teamId,
        boardId,
        grantedBy: data.grantedBy,
      })),
      skipDuplicates: true,
    });

    // Get all team members
    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId, leftAt: null },
      select: { userId: true, role: true },
    });

    // Grant individual board access to all team members
    const boardAccessEntries = [];
    for (const boardId of data.boardIds) {
      for (const member of teamMembers) {
        boardAccessEntries.push({
          userId: member.userId,
          boardId,
          role: member.role === "LEADER" ? BoardRole.ADMIN : BoardRole.EDITOR,
          grantedBy: data.grantedBy,
          grantedVia: GrantSource.TEAM,
        });
      }
    }

    if (boardAccessEntries.length > 0) {
      await this.prisma.boardAccess.createMany({
        data: boardAccessEntries,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Remove board access from team
   */
  async removeBoardFromTeam(teamId: string, boardId: string): Promise<void> {
    // Remove team board access
    await this.prisma.teamBoardAccess.deleteMany({
      where: {
        teamId,
        boardId,
      },
    });

    // Get all team members
    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId, leftAt: null },
      select: { userId: true },
    });

    // Remove individual board access for team members that was granted via team
    if (teamMembers.length > 0) {
      await this.prisma.boardAccess.deleteMany({
        where: {
          boardId,
          userId: { in: teamMembers.map((m) => m.userId) },
          grantedVia: GrantSource.TEAM,
        },
      });
    }
  }

  /**
   * Add members to team
   */
  async addTeamMembers(
    teamId: string,
    data: AddTeamMembersRequest
  ): Promise<TeamMemberResponse[]> {
    await this.prisma.teamMember.createMany({
      data: data.memberIds.map((userId) => ({
        teamId,
        userId,
        role: data.role || "MEMBER",
      })),
      skipDuplicates: true,
    });

    // Return the created members with user data
    const createdMembers = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        userId: { in: data.memberIds },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Grant board access to new members for all team boards
    const teamBoards = await this.prisma.teamBoardAccess.findMany({
      where: { teamId },
      select: { boardId: true, grantedBy: true },
    });

    if (teamBoards.length > 0) {
      const boardAccessEntries = [];

      for (const userId of data.memberIds) {
        for (const teamBoard of teamBoards) {
          boardAccessEntries.push({
            userId,
            boardId: teamBoard.boardId,
            role: data.role === "LEADER" ? BoardRole.ADMIN : BoardRole.EDITOR,
            grantedBy: teamBoard.grantedBy,
            grantedVia: GrantSource.TEAM,
          });
        }
      }

      if (boardAccessEntries.length > 0) {
        await this.prisma.boardAccess.createMany({
          data: boardAccessEntries,
          skipDuplicates: true,
        });
      }
    }

    return createdMembers.map((member) =>
      this.transformTeamMemberResponse(member)
    );
  }

  /**
   * Remove member from team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.updateMany({
      where: {
        teamId,
        userId,
      },
      data: {
        leftAt: new Date(),
      },
    });

    // Remove board access granted via this team
    const teamBoards = await this.prisma.teamBoardAccess.findMany({
      where: { teamId },
      select: { boardId: true },
    });

    if (teamBoards.length > 0) {
      await this.prisma.boardAccess.deleteMany({
        where: {
          userId,
          boardId: { in: teamBoards.map((tb) => tb.boardId) },
          grantedVia: GrantSource.TEAM,
        },
      });
    }
  }

  /**
   * Change team member role
   */
  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: "LEADER" | "MEMBER"
  ): Promise<TeamMemberResponse> {
    // If promoting to leader, first demote current leader to member
    if (role === "LEADER") {
      // Find current leader
      const currentLeader = await this.prisma.teamMember.findFirst({
        where: {
          teamId,
          role: "LEADER",
          leftAt: null,
        },
      });

      if (currentLeader && currentLeader.userId !== userId) {
        // Demote current leader to member
        await this.prisma.teamMember.update({
          where: {
            teamId_userId: {
              teamId,
              userId: currentLeader.userId,
            },
          },
          data: { role: "MEMBER" },
        });
      }

      // Also update the team's leaderId field
      await this.prisma.team.update({
        where: { id: teamId },
        data: { leaderId: userId },
      });
    }

    const updatedMember = await this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return this.transformTeamMemberResponse(updatedMember);
  }

  /**
   * Get teams where user is a member
   */
  async getUserTeams(userId: string): Promise<TeamResponse[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            leftAt: null,
          },
        },
        isActive: true,
      },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        boardAccess: {
          include: {
            board: {
              select: { id: true, title: true, color: true, description: true },
            },
          },
        },
        _count: {
          select: { members: true, boardAccess: true },
        },
      },
    });

    return teams.map((team) => this.transformTeamResponse(team));
  }

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(teamId: string): Promise<void> {
    await this.prisma.team.update({
      where: { id: teamId },
      data: { isActive: false },
    });
  }

  // Helper methods
  private transformTeamResponse(team: any): TeamResponse {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      color: team.color,
      objectives: team.objectives,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      leader: team.leader,
      organization: team.organization,
      members:
        team.members?.map((member: any) =>
          this.transformTeamMemberResponse(member)
        ) || [],
      boardAccess:
        team.boardAccess?.map((access: any) => ({
          id: access.id,
          board: access.board,
          grantedAt: access.grantedAt,
          grantedBy: access.grantedBy,
        })) || [],
      _count: team._count,
    };
  }

  private transformTeamMemberResponse(member: any): TeamMemberResponse {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
      performanceMetrics: member.performanceMetrics?.[0]
        ? {
            id: member.performanceMetrics[0].id,
            period: member.performanceMetrics[0].period,
            periodStart: member.performanceMetrics[0].periodStart,
            periodEnd: member.performanceMetrics[0].periodEnd,
            tasksAssigned: member.performanceMetrics[0].tasksAssigned,
            tasksCompleted: member.performanceMetrics[0].tasksCompleted,
            tasksInProgress: member.performanceMetrics[0].tasksInProgress,
            tasksOverdue: member.performanceMetrics[0].tasksOverdue,
            totalWorkingMinutes:
              member.performanceMetrics[0].totalWorkingMinutes,
            averageTaskCompletionHours:
              member.performanceMetrics[0].averageTaskCompletionHours,
            tasksCompletedOnTime:
              member.performanceMetrics[0].tasksCompletedOnTime,
            tasksCompletedLate: member.performanceMetrics[0].tasksCompletedLate,
            tasksReopened: member.performanceMetrics[0].tasksReopened,
            lastActiveDate: member.performanceMetrics[0].lastActiveDate,
            activeDaysInPeriod: member.performanceMetrics[0].activeDaysInPeriod,
            completionRate: member.performanceMetrics[0].completionRate,
            onTimeDeliveryRate: member.performanceMetrics[0].onTimeDeliveryRate,
            productivityScore: member.performanceMetrics[0].productivityScore,
            createdAt: member.performanceMetrics[0].createdAt,
            updatedAt: member.performanceMetrics[0].updatedAt,
          }
        : undefined,
    };
  }
}
