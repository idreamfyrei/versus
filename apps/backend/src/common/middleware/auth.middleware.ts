import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";
import { throwApiError } from "../utils/response.js";
import { ErrorCode } from "@versus/shared";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const auth = getAuth();
    const session = await auth!.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return throwApiError(401, ErrorCode.AUTH_REQUIRED);
    }

    req.user = session.user as Express.Request["user"];
    req.session = session.session as Express.Request["session"];
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const auth = getAuth();
    const session = await auth!.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch {
    next();
  }
};
