import { Router } from "express";
import { requireAuth, optionalAuth } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { respondLimiter, createPollLimiter, getPollLimiter } from "../../common/middleware/rateLimiter.middleware.js";
import { createPollSchema, submitResponseSchema, claimPollSchema } from "@versus/shared";
import * as controller from "./vs.controller.js";

const router: Router = Router();

router.post("/", optionalAuth, createPollLimiter, validate(createPollSchema), controller.createPoll);
router.get("/", requireAuth, controller.listPolls);
router.post("/claim", requireAuth, validate(claimPollSchema), controller.claimPoll);
router.get("/:slugOrId", getPollLimiter, optionalAuth, controller.getPoll);
router.post("/:slugOrId/respond", respondLimiter, optionalAuth, validate(submitResponseSchema), controller.submitResponse);
router.patch("/:id/activate", optionalAuth, controller.activatePoll);
router.patch("/:id/close", optionalAuth, controller.closePoll);
router.patch("/:id/publish", optionalAuth, controller.publishPoll);
router.delete("/:id", requireAuth, controller.deletePoll);
router.get("/:id/analytics", requireAuth, controller.getAnalytics);

export default router;
