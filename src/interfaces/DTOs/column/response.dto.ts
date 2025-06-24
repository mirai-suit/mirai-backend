// Task Response DTO (minimal for column context - avoid circular references)
export interface TaskInColumnDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  priority?: number;
  order?: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// Main Column Response DTO
export interface ColumnResponseDto {
  id: string;
  name: string;
  color: string;
  order: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: TaskInColumnDto[]; // Use minimal task data
}

// API Response DTOs
export interface CreateColumnResponseDto {
  success: boolean;
  message?: string;
  column: ColumnResponseDto;
}

export interface GetColumnResponseDto {
  success: boolean;
  column: ColumnResponseDto;
}

export interface GetColumnsResponseDto {
  success: boolean;
  columns: ColumnResponseDto[];
}

export interface UpdateColumnResponseDto {
  success: boolean;
  message?: string;
  column: ColumnResponseDto;
}

export interface DeleteColumnResponseDto {
  success: boolean;
  message?: string;
  column: {
    id: string;
    name: string;
  };
}

export interface ReorderResponseDto {
  success: boolean;
  message?: string;
}

// Error Response DTO
export interface ColumnErrorResponseDto {
  success: false;
  message: string;
  statusCode?: number;
}
