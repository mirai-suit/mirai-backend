// User Output (for sender)
export interface UserOutput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Message Response DTO (Enhanced)
export interface MessageDto {
  id: string;
  threadId: string;
  sender: UserOutput;
  text: string;
  messageType: string;
  mentionedUsers: string[];
  replyToId?: string;
  replyTo?: {
    id: string;
    text: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  reactions?: any;
  createdAt: string;
}

// Single Message Response
export interface MessageResponseDto {
  success: boolean;
  message?: string;
  sender_message: MessageDto;
}

// Message Thread with enhanced features
export interface MessageThread {
  id: string;
  boardId: string;
  messages: MessageDto[];
  lastMessageAt?: string;
  unreadCount: number;
  isArchived: boolean;
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
  messages: MessageDto[];
}

// Search Messages Response DTO
export interface SearchMessagesResponseDto {
  success: boolean;
  message?: string;
  messages: MessageDto[];
}

// Board Users for Mentions Response
export interface BoardUserForMention {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  mentionText: string;
}

export interface BoardUsersForMentionsResponseDto {
  success: boolean;
  message?: string;
  users: BoardUserForMention[];
}

// Edit/Delete Message Response
export interface MessageActionResponseDto {
  success: boolean;
  message?: string;
  updatedMessage?: MessageDto;
}

// Mark as Read Response
export interface MarkAsReadResponseDto {
  success: boolean;
  message?: string;
}
