import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  AssignUsersInput,
  GetTasksFilterInput,
} from "../../../schemas/task.schema";

// Request DTOs
export interface CreateTaskRequestDto extends CreateTaskInput {}

export interface UpdateTaskRequestDto extends Omit<UpdateTaskInput, "id"> {}

export interface MoveTaskRequestDto extends MoveTaskInput {}

export interface AssignUsersRequestDto extends AssignUsersInput {}

export interface GetTasksFilterRequestDto extends GetTasksFilterInput {}

// Additional request interfaces
export interface GetTaskByIdRequestDto {
  taskId: string;
}

export interface DeleteTaskRequestDto {
  taskId: string;
}
