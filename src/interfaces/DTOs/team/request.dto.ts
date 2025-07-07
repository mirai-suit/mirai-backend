// Team-related DTOs

import { UserPerformanceMetricsResponse } from "../performance/response.dto";

// Request DTOs
export interface CreateTeamRequest {
  name: string;
  description?: string;
  color?: string;
  leaderId: string;
  organizationId: string;
  memberIds: string[];
  boardIds?: string[];
  objectives?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  color?: string;
  leaderId?: string;
  objectives?: string;
  isActive?: boolean;
}

export interface AssignBoardsToTeamRequest {
  boardIds: string[];
  grantedBy: string;
}

export interface AddTeamMembersRequest {
  memberIds: string[];
  role?: "MEMBER" | "LEADER";
}

// Response DTOs
export interface TeamMemberResponse {
  id: string;
  userId: string;
  role: "LEADER" | "MEMBER";
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  performanceMetrics?: UserPerformanceMetricsResponse;
}

export interface TeamBoardAccessResponse {
  id: string;
  board: {
    id: string;
    title: string;
    color: string;
    description?: string;
  };
  grantedAt: Date;
  grantedBy: string;
}

export interface TeamResponse {
  id: string;
  name: string;
  description?: string;
  color: string;
  objectives?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  leader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  organization: {
    id: string;
    name: string;
  };
  members: TeamMemberResponse[];
  boardAccess: TeamBoardAccessResponse[];
  _count?: {
    members: number;
    boardAccess: number;
  };
}

export interface TeamsListResponse {
  teams: TeamResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
