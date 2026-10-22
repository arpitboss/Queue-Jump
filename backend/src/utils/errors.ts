export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND", details?: unknown) {
    super(message, 404, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED", details?: unknown) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN", details?: unknown) {
    super(message, 403, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", code = "CONFLICT", details?: unknown) {
    super(message, 409, code, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.", code = "RATE_LIMITED", details?: unknown) {
    super(message, 429, code, details);
  }
}