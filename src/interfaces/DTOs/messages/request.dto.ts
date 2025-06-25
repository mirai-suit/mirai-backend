// Send a message in a board's thread
export interface SendMessageDto {
  boardId: string;
  text: string;
}

// Get paginated messages for a board
export interface GetMessagesForBoardDto {
  boardId: string;
  skip?: number;
  take?: number;
  cursor?: string;
}