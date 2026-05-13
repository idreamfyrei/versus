import { createHash } from "crypto";
import type { Request } from "express";

export const generateFingerprint = (req: Request): string => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const ua = req.headers["user-agent"] ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
};
