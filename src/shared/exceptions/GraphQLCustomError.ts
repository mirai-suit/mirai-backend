export default class GraphQLCustomError extends Error {
  statusCode: number;
  originalError?: Error | null | undefined;
  constructor(
    message: string,
    statusCode: number,
    originalError: Error | null | undefined
  ) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}
