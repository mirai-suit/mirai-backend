// Performance tracking DTOs

// Request DTOs
export interface CreatePerformanceMetricsRequest {
  userId: string;
  teamMemberId: string;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  periodStart: Date;
  periodEnd: Date;
}

export interface UpdatePerformanceMetricsRequest {
  tasksAssigned?: number;
  tasksCompleted?: number;
  tasksInProgress?: number;
  tasksOverdue?: number;
  totalWorkingMinutes?: number;
  tasksCompletedOnTime?: number;
  tasksCompletedLate?: number;
  tasksReopened?: number;
  activeDaysInPeriod?: number;
}

export interface TaskActivityLogRequest {
  taskId: string;
  userId: string;
  action:
    | "created"
    | "started"
    | "completed"
    | "reopened"
    | "commented"
    | "updated";
  fromStatus?: string;
  toStatus?: string;
  timeSpent?: number;
  notes?: string;
}

// Response DTOs
export interface UserPerformanceMetricsResponse {
  id: string;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  periodStart: Date;
  periodEnd: Date;

  // Basic metrics
  tasksAssigned: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;

  // Time metrics
  totalWorkingMinutes: number;
  averageTaskCompletionHours: number;

  // Quality metrics
  tasksCompletedOnTime: number;
  tasksCompletedLate: number;
  tasksReopened: number;

  // Activity metrics
  lastActiveDate?: Date;
  activeDaysInPeriod: number;

  // Calculated metrics
  completionRate: number;
  onTimeDeliveryRate: number;
  productivityScore: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface TaskActivityLogResponse {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  timeSpent?: number;
  notes?: string;
  timestamp: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface TeamPerformanceOverviewResponse {
  teamId: string;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  periodStart: Date;
  periodEnd: Date;

  // Team averages
  averageCompletionRate: number;
  averageProductivityScore: number;
  averageOnTimeDeliveryRate: number;
  totalTasksCompleted: number;
  totalTasksAssigned: number;

  // Team activity
  activeMembers: number;
  totalMembers: number;

  // Individual member performance
  members: Array<{
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

  // Insights
  insights: Array<{
    type: "positive" | "warning" | "negative";
    title: string;
    description: string;
    actionRequired?: boolean;
  }>;
}

export interface PerformanceReportResponse {
  teamId: string;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY";
  generatedAt: Date;

  teamOverview: TeamPerformanceOverviewResponse;

  // Detailed analytics
  trends: {
    completionRate: Array<{ date: Date; value: number }>;
    productivityScore: Array<{ date: Date; value: number }>;
    onTimeDelivery: Array<{ date: Date; value: number }>;
  };

  // Top performers
  topPerformers: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    score: number;
    achievement: string;
  }>;

  // Recommendations
  recommendations: Array<{
    category: "training" | "workload" | "recognition" | "support";
    message: string;
    priority: "high" | "medium" | "low";
    targetUsers?: string[];
  }>;
}
