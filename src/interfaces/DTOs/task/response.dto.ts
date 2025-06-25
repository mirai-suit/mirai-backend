// Base task response structure (minimal to avoid circular references)
export interface TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  customStatus?: string;
  startDate?: string;
  dueDate?: string;
  priority?: string;
  order: number;
  isRecurring: boolean;
  boardId: string;
  columnId: string;
  teamId?: string;
  assignees: TaskAssigneeDto[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Detailed task response (when requesting specific task with relations)
export interface TaskDetailResponseDto extends TaskResponseDto {
  column: TaskColumnDto;
  board?: TaskBoardDto;
  team?: TaskTeamDto;
}

// Nested DTOs for task responses
export interface TaskAssigneeDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface TaskColumnDto {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface TaskBoardDto {
  id: string;
  title: string;
  color: string;
  organizationId: string;
}

export interface TaskTeamDto {
  id: string;
  name: string;
}

// API Response wrappers
export interface CreateTaskResponseDto {
  success: boolean;
  message?: string;
  task: TaskDetailResponseDto; // Use detailed version for single task responses
}

export interface GetTaskResponseDto {
  success: boolean;
  message?: string;
  task: TaskDetailResponseDto; // Use detailed version for single task responses
}

export interface GetTasksResponseDto {
  success: boolean;
  message?: string;
  tasks: TaskResponseDto[]; // Use minimal version for lists
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateTaskResponseDto {
  success: boolean;
  message?: string;
  task: TaskDetailResponseDto; // Use detailed version for single task responses
}

export interface DeleteTaskResponseDto {
  success: boolean;
  message?: string;
  task: {
    id: string;
    deletedAt: string;
  };
}

export interface MoveTaskResponseDto {
  success: boolean;
  message?: string;
  task: TaskDetailResponseDto; // Use detailed version for single task responses
}

export interface AssignUsersResponseDto {
  success: boolean;
  message?: string;
  task: TaskDetailResponseDto; // Use detailed version for single task responses
}
