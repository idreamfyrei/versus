import rateLimit from "express-rate-limit";

export const createLimiter = (max: number, windowMs: number) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later",
      },
    },
  });

export const respondLimiter = createLimiter(5, 60 * 1000);
export const createPollLimiter = createLimiter(3, 60 * 1000);
export const getPollLimiter = createLimiter(30, 60 * 1000);
export const authLimiter = createLimiter(10, 60 * 1000);
