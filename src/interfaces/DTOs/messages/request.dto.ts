// Send a message in a board's thread
export interface SendMessageDto {
  boardId: string;
  text: string;
  replyToId?: string; // Optional reply to another message
}

// Get paginated messages for a board
export interface GetMessagesForBoardDto {
  boardId: string;
  skip?: number;
  take?: number;
  cursor?: string;
}

// Search messages in a board
export interface SearchMessagesDto {
  boardId: string;
  q: string; // search query
  skip?: number;
  take?: number;
}

// Edit a message
export interface EditMessageDto {
  messageId: string;
  text: string;
}

// Delete a message
export interface DeleteMessageDto {
  messageId: string;
}

// Mark messages as read
export interface MarkMessagesAsReadDto {
  boardId: string;
}
