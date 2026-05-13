import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod/v4";
import { throwApiError } from "../utils/response.js";
import { ErrorCode } from "@versus/shared";

export const validate = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throwApiError(400, ErrorCode.VALIDATION_ERROR, "Validation failed", result.error.issues);
    }
    req.body = result.data;
    next();
  };
};
