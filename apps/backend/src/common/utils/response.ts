import type { Request, Response, NextFunction } from "express";
import { ErrorCode, ErrorMessage } from "@versus/shared";
import type { ErrorCode as ErrorCodeType } from "@versus/shared";

export class ApiError extends Error {
  statusCode: number;
  code: ErrorCodeType;
  details?: unknown;

  constructor(statusCode: number, code: ErrorCodeType, message?: string, details?: unknown) {
    super(message ?? ErrorMessage[code]);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) => {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

export const throwApiError = (
  statusCode: number,
  code: ErrorCodeType,
  message?: string,
  details?: unknown,
): never => {
  throw new ApiError(statusCode, code, message, details);
};

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: ErrorMessage[ErrorCode.INTERNAL_ERROR],
    },
  });
};
