export interface CreateColumnDto {
  name: string;
  boardId: string;
  color?: string;
  order?: number;
}

export interface UpdateColumnDto {
  columnId: string;
  name?: string;
  color?: string;
}

export interface ReorderColumnTasksDto {
  columnId: string;
  orderedTaskIds: string[];
}

export interface GetColumnsForBoardDto {
  boardId: string;
}

export interface DeleteColumnDto {
  columnId: string;
}

export interface ReorderColumnsDto {
  boardId: string;
  columnIds: string[];
}
