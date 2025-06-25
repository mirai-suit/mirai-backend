// User Output (for sender)
export interface UserOutput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Message Response DTO
export interface MessageDto {
  id: string;
  threadId: string;
  sender: UserOutput;
  text: string;
  createdAt: string;
}

export interface MessageResponseDto {
    success: boolean;
    message?: string;
    sender_message: MessageDto; 
}

export interface MessageThread {
    id: string;
    boardId: string;
    messages: MessageDto[];
    createdAt: string;
    updatedAt: string;
}

// Message Thread Response DTO
export interface MessageThreadResponseDto {
  success: boolean;
  message?: string;
  thread: MessageThread;
}

// Paginated Messages Response DTO
export interface PaginatedMessagesResponseDto {
  success: boolean;
  message?: string;
  messages: MessageResponseDto[];
}
