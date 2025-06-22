// Column Response DTO
export interface ColumnResponseDto {
  id: string;
  name: string;
  color: string;
  order: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

// Task Response DTO (basic for now)
export interface TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  priority?: number;
  order?: number;
  columnId: string;
  boardId: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Team Response DTO (basic)
export interface TeamResponseDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Board Access Response DTO
export interface BoardAccessResponseDto {
  id: string;
  userId: string;
  boardId: string;
  accessRole: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

// Main Board Response DTO
export interface BoardResponseDto {
  id: string;
  title: string;
  description?: string;
  color: string;
  coverImage?: string;
  organizationId: string;
  teamId?: string;
  isArchived: boolean;
  isPublic: boolean;
  isTemplate: boolean;
  isPrivate: boolean;
  isReadOnly: boolean;
  isShared: boolean;
  isDefault: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  columns?: ColumnResponseDto[];
  tasks?: TaskResponseDto[];
  team?: TeamResponseDto[];
  accessList?: BoardAccessResponseDto[];
}

// API Response DTOs
export interface CreateBoardResponseDto {
  success: boolean;
  message?: string;
  board: BoardResponseDto;
}

export interface GetBoardResponseDto {
  success: boolean;
  board: BoardResponseDto;
}

export interface GetBoardsResponseDto {
  success: boolean;
  boards: BoardResponseDto[];
}

export interface UpdateBoardResponseDto {
  success: boolean;
  message?: string;
  board: BoardResponseDto;
}

export interface DeleteBoardResponseDto {
  success: boolean;
  message?: string;
  board: {
    id: string;
    title: string;
  };
}

export interface BoardAccessResponseActionDto {
  success: boolean;
  message?: string;
  access?: BoardAccessResponseDto;
  removed?: BoardAccessResponseDto;
}

// Error Response DTO (consistent across all endpoints)
export interface BoardErrorResponseDto {
  success: false;
  message: string;
  statusCode?: number;
}
