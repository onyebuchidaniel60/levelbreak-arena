export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errors = {
  unauthorized: (message = "Authentication is required.") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "Request is not allowed.") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Resource not found.") =>
    new AppError(404, "NOT_FOUND", message),
  conflict: (code: string, message: string) => new AppError(409, code, message),
  badRequest: (code: string, message: string) =>
    new AppError(400, code, message),
  unprocessable: (code: string, message: string) =>
    new AppError(422, code, message),
  rateLimited: (message = "Too many requests.") =>
    new AppError(429, "RATE_LIMITED", message),
  unavailable: (message = "Service unavailable.") =>
    new AppError(503, "UNAVAILABLE", message),
};
