export interface CreateNoteResponseDto {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    content: string;
    category: string;
    boardId: string;
    authorId: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  error?: any;
}

export interface GetNoteResponseDto {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    content: string;
    category: string;
    boardId: string;
    authorId: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  error?: any;
}

export interface GetNotesResponseDto {
  success: boolean;
  message: string;
  data?: {
    notes: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      boardId: string;
      authorId: string;
      isPinned: boolean;
      createdAt: string;
      updatedAt: string;
      author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
      };
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  error?: any;
}

export interface UpdateNoteResponseDto {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    content: string;
    category: string;
    boardId: string;
    authorId: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
  error?: any;
}

export interface DeleteNoteResponseDto {
  success: boolean;
  message: string;
  data?: {
    id: string;
  };
  error?: any;
}
