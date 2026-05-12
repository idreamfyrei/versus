export const ErrorCode = {
  POLL_NOT_FOUND: "POLL_NOT_FOUND",
  POLL_EXPIRED: "POLL_EXPIRED",
  POLL_CLOSED: "POLL_CLOSED",
  POLL_NOT_ACTIVE: "POLL_NOT_ACTIVE",
  POLL_DRAFT: "POLL_DRAFT",
  POLL_ALREADY_PUBLISHED: "POLL_ALREADY_PUBLISHED",
  ALREADY_RESPONDED: "ALREADY_RESPONDED",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_ADMIN_KEY: "INVALID_ADMIN_KEY",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SLUG_TAKEN: "SLUG_TAKEN",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.POLL_NOT_FOUND]: "Poll not found",
  [ErrorCode.POLL_EXPIRED]: "This poll has expired and is no longer accepting responses",
  [ErrorCode.POLL_CLOSED]: "This poll has been closed and is no longer accepting responses",
  [ErrorCode.POLL_NOT_ACTIVE]: "This poll is not currently accepting responses",
  [ErrorCode.POLL_DRAFT]: "This poll is still in draft mode",
  [ErrorCode.POLL_ALREADY_PUBLISHED]: "This poll has already been published",
  [ErrorCode.ALREADY_RESPONDED]: "You have already responded to this poll",
  [ErrorCode.AUTH_REQUIRED]: "You must be logged in to perform this action",
  [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action",
  [ErrorCode.INVALID_ADMIN_KEY]: "Invalid admin key",
  [ErrorCode.VALIDATION_ERROR]: "Validation failed",
  [ErrorCode.SLUG_TAKEN]: "This slug is already taken",
  [ErrorCode.RATE_LIMITED]: "Too many requests. Please try again later",
  [ErrorCode.INTERNAL_ERROR]: "An unexpected error occurred",
};
