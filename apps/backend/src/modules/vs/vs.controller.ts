import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import { UAParser } from "ua-parser-js";
import mongoose from "mongoose";
import { ErrorCode } from "@versus/shared";
import { Poll, type IPoll } from "../../common/models/poll.model.js";
import { PollResponse } from "../../common/models/response.model.js";
import { sendSuccess, throwApiError } from "../../common/utils/response.js";
import { generateFingerprint } from "../../common/utils/fingerprint.js";
import { getIO } from "../socket/index.js";

const hashAdminKey = (key: string) =>
  createHash("sha256").update(key).digest("hex");

const hashIp = (ip: string) =>
  createHash("sha256").update(ip).digest("hex");

const findPollBySlugOrId = async (slugOrId: string): Promise<IPoll | null> => {
  const poll = await Poll.findOne({ slug: slugOrId });
  if (poll) return poll;
  const byShareId = await Poll.findOne({ shareId: slugOrId });
  if (byShareId) return byShareId;
  if (mongoose.Types.ObjectId.isValid(slugOrId)) {
    return Poll.findById(slugOrId);
  }
  return null;
};

const checkExpiry = async (poll: IPoll): Promise<IPoll> => {
  if (poll.status === "active" && poll.expiresAt < new Date()) {
    poll.status = "expired";
    await poll.save();
  }
  return poll;
};

const computeQuestionSummaries = async (
  pollId: mongoose.Types.ObjectId,
  poll: IPoll,
) => {
  const pipeline = await PollResponse.aggregate([
    { $match: { poll: pollId } },
    { $unwind: "$answers" },
    {
      $group: {
        _id: {
          questionId: "$answers.questionId",
          optionId: "$answers.optionId",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.questionId",
        options: { $push: { optionId: "$_id.optionId", count: "$count" } },
        totalAnswers: { $sum: "$count" },
      },
    },
  ]);

  return poll.questions.map((q) => {
    const agg = pipeline.find((p) => p._id.toString() === q._id.toString());
    const totalAnswers = agg?.totalAnswers ?? 0;

    const options = q.options.map((opt) => {
      const found = agg?.options.find(
        (o: { optionId: mongoose.Types.ObjectId; count: number }) =>
          o.optionId.toString() === opt._id.toString(),
      );
      const count = found?.count ?? 0;
      return {
        optionId: opt._id.toString(),
        optionText: opt.text,
        count,
        percentage:
          totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
      };
    });

    const maxPct = Math.max(...options.map((o) => o.percentage), 0);
    const topCount = options.filter((o) => o.percentage === maxPct).length;
    let consensus: "clear_winner" | "tight_race" | "split_decision" =
      "split_decision";
    if (maxPct >= 60) consensus = "clear_winner";
    else if (topCount <= 2 && maxPct >= 35) consensus = "tight_race";

    return {
      questionId: q._id.toString(),
      questionText: q.text,
      totalAnswers,
      options,
      consensus,
    };
  });
};

export const createPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      title,
      description,
      questions,
      isAnonymous,
      showCreatorName,
      enableToast,
      slug,
      expiresAt,
    } = req.body;

    if (slug) {
      const existing = await Poll.findOne({ slug });
      if (existing) {
        const isAbandonedDraft =
          existing.status === "draft" &&
          !existing.creator &&
          existing.createdAt.getTime() < Date.now() - 60 * 60 * 1000;
        if (isAbandonedDraft) {
          await Poll.deleteOne({ _id: existing._id });
        } else {
          throwApiError(409, ErrorCode.SLUG_TAKEN);
        }
      }
    }

    const shareId = nanoid(10);
    const questionsWithOrder = questions.map(
      (
        q: { text: string; options: { text: string }[]; isMandatory?: boolean },
        i: number,
      ) => ({
        text: q.text,
        options: q.options.map((o: { text: string }) => ({ text: o.text })),
        isMandatory: q.isMandatory ?? true,
        order: i,
      }),
    );

    let adminKey: string | undefined;
    let adminKeyHash: string | undefined;

    if (!req.user) {
      adminKey = nanoid(32);
      adminKeyHash = hashAdminKey(adminKey);
    }

    const poll = await Poll.create({
      title,
      description,
      questions: questionsWithOrder,
      isAnonymous: !!isAnonymous,
      showCreatorName: !!showCreatorName,
      enableToast: !!enableToast,
      slug,
      shareId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      creator: req.user ? new mongoose.Types.ObjectId(req.user.id) : null,
      adminKeyHash,
    });

    sendSuccess(
      res,
      { poll, ...(adminKey && { adminKey }) },
      "Poll created",
      201,
    );
  } catch (error) {
    next(error);
  }
};

export const updatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);

    if (poll.status !== "draft")
      throwApiError(400, ErrorCode.POLL_NOT_ACTIVE, "Only draft polls can be edited");

    if (poll.creator) {
      if (!req.user || poll.creator.toString() !== req.user.id)
        throwApiError(403, ErrorCode.FORBIDDEN);
    } else {
      const adminKey = req.body?.adminKey as string | undefined;
      if (!adminKey || !poll.adminKeyHash || hashAdminKey(adminKey) !== poll.adminKeyHash)
        throwApiError(403, ErrorCode.INVALID_ADMIN_KEY);
    }

    const { title, description, questions, isAnonymous, showCreatorName, enableToast, slug, expiresAt } = req.body;

    if (slug && slug !== poll.slug) {
      const existing = await Poll.findOne({ slug, _id: { $ne: poll._id } });
      if (existing) {
        const isAbandonedDraft =
          existing.status === "draft" &&
          !existing.creator &&
          existing.createdAt.getTime() < Date.now() - 60 * 60 * 1000;
        if (isAbandonedDraft) {
          await Poll.deleteOne({ _id: existing._id });
        } else {
          throwApiError(409, ErrorCode.SLUG_TAKEN);
        }
      }
    }

    if (title !== undefined) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (isAnonymous !== undefined) poll.isAnonymous = isAnonymous;
    if (showCreatorName !== undefined) poll.showCreatorName = showCreatorName;
    if (enableToast !== undefined) poll.enableToast = enableToast;
    if (slug !== undefined) poll.slug = slug || undefined;
    if (expiresAt !== undefined) poll.expiresAt = new Date(expiresAt);
    if (questions !== undefined) {
      poll.questions = questions.map(
        (q: { text: string; options: { text: string }[]; isMandatory?: boolean }, i: number) => ({
          text: q.text,
          options: q.options.map((o: { text: string }) => ({ text: o.text })),
          isMandatory: q.isMandatory ?? true,
          order: i,
        }),
      );
    }

    await poll.save();
    sendSuccess(res, { poll }, "Poll updated");
  } catch (error) {
    next(error);
  }
};

export const listPolls = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const polls = await Poll.find({ creator: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    const pollIds = polls.map((p) => p._id);
    const responseCounts = await PollResponse.aggregate([
      { $match: { poll: { $in: pollIds } } },
      { $group: { _id: "$poll", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      responseCounts.map((r) => [r._id.toString(), r.count]),
    );

    const result = polls.map((p) => ({
      _id: p._id,
      title: p.title,
      status: p.status,
      shareId: p.shareId,
      slug: p.slug,
      isAnonymous: p.isAnonymous,
      isPublished: p.isPublished,
      expiresAt: p.expiresAt,
      responseCount: countMap.get(p._id.toString()) ?? 0,
      createdAt: p.createdAt,
    }));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await findPollBySlugOrId(req.params.slugOrId as string);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);

    await checkExpiry(poll);

    if (poll.status === "draft") {
      if (!req.user || poll.creator?.toString() !== req.user.id) {
        throwApiError(404, ErrorCode.POLL_NOT_FOUND);
      }
      sendSuccess(res, { poll, hasResponded: false, canClaim: false });
      return;
    }

    const ipHash = hashIp(req.ip ?? req.socket.remoteAddress ?? "unknown");
    const viewResult = await Poll.updateOne(
      { _id: poll._id, viewerHashes: { $ne: ipHash } },
      { $inc: { views: 1 }, $addToSet: { viewerHashes: ipHash } },
    );
    // viewResult.modifiedCount === 0 means this IP already viewed — no increment

    let hasResponded = false;
    if (req.user) {
      const existing = await PollResponse.findOne({
        poll: poll._id,
        respondent: req.user.id,
      });
      hasResponded = !!existing;
    } else if (poll.isAnonymous) {
      const fp = generateFingerprint(req);
      const existing = await PollResponse.findOne({
        poll: poll._id,
        fingerprint: fp,
      });
      hasResponded = !!existing;
    }

    const adminKey = req.query.key as string | undefined;
    let canClaim = false;
    if (adminKey && poll.adminKeyHash && !poll.creator) {
      canClaim = hashAdminKey(adminKey) === poll.adminKeyHash;
    }

    const showResults =
      poll.isPublished ||
      poll.status === "expired" ||
      poll.status === "closed" ||
      hasResponded;

    let results;
    if (showResults) {
      const totalResponses = await PollResponse.countDocuments({
        poll: poll._id,
      });
      const questionSummaries = await computeQuestionSummaries(
        poll._id as mongoose.Types.ObjectId,
        poll,
      );

      const age = Date.now() - poll.createdAt.getTime();
      const days = Math.floor(age / (1000 * 60 * 60 * 24));
      const summary = `${totalResponses} vote${totalResponses !== 1 ? "s" : ""} collected over ${days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "today"}`;

      results = { totalResponses, questionSummaries, summary };
    }

    sendSuccess(res, { poll, hasResponded, canClaim, results });
  } catch (error) {
    next(error);
  }
};

export const submitResponse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await findPollBySlugOrId(req.params.slugOrId as string);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);

    await checkExpiry(poll);
    if (poll.status !== "active") {
      if (poll.status === "expired") throwApiError(410, ErrorCode.POLL_EXPIRED);
      if (poll.status === "closed") throwApiError(410, ErrorCode.POLL_CLOSED);
      throwApiError(403, ErrorCode.POLL_NOT_ACTIVE);
    }

    if (!poll.isAnonymous && !req.user) {
      throwApiError(401, ErrorCode.AUTH_REQUIRED);
    }

    if (!poll.isAnonymous && req.user) {
      const existing = await PollResponse.findOne({
        poll: poll._id,
        respondent: req.user.id,
      });
      if (existing) throwApiError(409, ErrorCode.ALREADY_RESPONDED);
    }

    let fingerprint: string | undefined;
    if (poll.isAnonymous) {
      fingerprint = generateFingerprint(req);
      const existing = await PollResponse.findOne({
        poll: poll._id,
        fingerprint,
      });
      if (existing) throwApiError(409, ErrorCode.ALREADY_RESPONDED);
    }

    const { answers } = req.body;

    const mandatoryIds = new Set(
      poll.questions.filter((q) => q.isMandatory).map((q) => q._id.toString()),
    );
    const answeredIds = new Set(
      answers.map((a: { questionId: string }) => a.questionId),
    );

    for (const mId of mandatoryIds) {
      if (!answeredIds.has(mId)) {
        throwApiError(
          400,
          ErrorCode.VALIDATION_ERROR,
          "All mandatory questions must be answered",
        );
      }
    }

    for (const answer of answers) {
      const question = poll.questions.find(
        (q) => q._id.toString() === answer.questionId,
      );
      if (!question)
        return throwApiError(
          400,
          ErrorCode.VALIDATION_ERROR,
          `Question ${answer.questionId} not found`,
        );
      const option = question.options.find(
        (o) => o._id.toString() === answer.optionId,
      );
      if (!option)
        throwApiError(
          400,
          ErrorCode.VALIDATION_ERROR,
          `Option ${answer.optionId} not found`,
        );
    }

    const uaString = Array.isArray(req.headers["user-agent"]) ? req.headers["user-agent"][0] : req.headers["user-agent"];
    const uaResult = UAParser(uaString ?? "");

    await PollResponse.create({
      poll: poll._id,
      respondent: req.user?.id || undefined,
      ...(fingerprint && { fingerprint }),
      device: {
        type: uaResult.device.type ?? "desktop",
        browser: uaResult.browser.name ?? "unknown",
        os: uaResult.os.name ?? "unknown",
      },
      answers,
    });

    const totalResponses = await PollResponse.countDocuments({
      poll: poll._id,
    });
    const questionSummaries = await computeQuestionSummaries(
      poll._id as mongoose.Types.ObjectId,
      poll,
    );

    try {
      const io = getIO();
      io.to(`vs:${poll._id.toString()}`).emit("response:new", {
        totalResponses,
        questionSummaries,
      });

      if (poll.enableToast) {
        io.to(`vs:${poll._id.toString()}`).emit("toast:vote:updates", {
          message: "Someone just voted!",
        });
      }
    } catch {
      // socket not available, continue
    }

    const age = Date.now() - poll.createdAt.getTime();
    const days = Math.floor(age / (1000 * 60 * 60 * 24));
    const summary = `${totalResponses} vote${totalResponses !== 1 ? "s" : ""} collected over ${days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "today"}`;

    sendSuccess(
      res,
      {
        results: { totalResponses, questionSummaries, summary },
      },
      "Response submitted",
    );
  } catch (error) {
    next(error);
  }
};

export const activatePoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);

    if (poll.status !== "draft")
      throwApiError(
        400,
        ErrorCode.POLL_NOT_ACTIVE,
        "Poll can only be activated from draft status",
      );

    if (poll.creator) {
      if (!req.user || poll.creator.toString() !== req.user.id)
        throwApiError(403, ErrorCode.FORBIDDEN);
    } else {
      const adminKey = req.body?.adminKey as string | undefined;
      if (
        !adminKey ||
        !poll.adminKeyHash ||
        hashAdminKey(adminKey) !== poll.adminKeyHash
      ) {
        throwApiError(403, ErrorCode.INVALID_ADMIN_KEY);
      }
    }

    poll.status = "active";
    await poll.save();
    sendSuccess(res, { poll }, "Poll is now live");
  } catch (error) {
    next(error);
  }
};

export const closePoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);
    if (poll.status !== "active")
      throwApiError(
        400,
        ErrorCode.POLL_NOT_ACTIVE,
        "Only active polls can be closed",
      );

    if (poll.creator) {
      if (!req.user || poll.creator.toString() !== req.user.id)
        throwApiError(403, ErrorCode.FORBIDDEN);
    } else {
      const adminKey = req.body?.adminKey as string | undefined;
      if (
        !adminKey ||
        !poll.adminKeyHash ||
        hashAdminKey(adminKey) !== poll.adminKeyHash
      ) {
        throwApiError(403, ErrorCode.INVALID_ADMIN_KEY);
      }
    }

    poll.status = "closed";
    await poll.save();

    try {
      getIO()
        .to(`vs:${poll._id.toString()}`)
        .emit("poll:closed", { status: "closed" });
    } catch {
      // socket not available, continue
    }

    sendSuccess(res, { poll }, "Poll closed");
  } catch (error) {
    next(error);
  }
};

export const publishPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);
    if (poll.isPublished) throwApiError(400, ErrorCode.POLL_ALREADY_PUBLISHED);
    if (poll.status === "draft")
      throwApiError(400, ErrorCode.POLL_DRAFT, "Cannot publish a draft poll");

    if (poll.creator) {
      if (!req.user || poll.creator.toString() !== req.user.id)
        throwApiError(403, ErrorCode.FORBIDDEN);
    } else {
      const adminKey = req.body?.adminKey as string | undefined;
      if (
        !adminKey ||
        !poll.adminKeyHash ||
        hashAdminKey(adminKey) !== poll.adminKeyHash
      ) {
        throwApiError(403, ErrorCode.INVALID_ADMIN_KEY);
      }
    }

    poll.isPublished = true;
    await poll.save();

    try {
      getIO()
        .to(`vs:${poll._id.toString()}`)
        .emit("poll:published", { status: "published" });
    } catch {
      // socket not available, continue
    }

    sendSuccess(res, { poll }, "Results published");
  } catch (error) {
    next(error);
  }
};

export const deletePoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);
    if (!poll.creator || poll.creator.toString() !== req.user!.id)
      throwApiError(403, ErrorCode.FORBIDDEN);

    try {
      getIO().to(`vs:${poll._id.toString()}`).emit("poll:deleted", {});
    } catch {
      // socket not available, continue

    }

    await PollResponse.deleteMany({ poll: poll._id });
    await poll.deleteOne();

    sendSuccess(res, null, "Poll deleted");
  } catch (error) {
    next(error);
  }
};

export const claimPoll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { adminKey } = req.body;
    const keyHash = hashAdminKey(adminKey);
    const poll = await Poll.findOne({ adminKeyHash: keyHash });
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND, "No poll found with that admin key");
    if (poll.creator)
      throwApiError(400, ErrorCode.FORBIDDEN, "Poll already has an owner");

    poll.creator = new mongoose.Types.ObjectId(req.user!.id);
    poll.adminKeyHash = undefined;
    await poll.save();

    sendSuccess(res, { poll }, "Poll claimed successfully");
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return throwApiError(404, ErrorCode.POLL_NOT_FOUND);
    if (!poll.creator || poll.creator.toString() !== req.user!.id)
      throwApiError(403, ErrorCode.FORBIDDEN);

    await checkExpiry(poll);

    const pollId = poll._id as mongoose.Types.ObjectId;
    const totalResponses = await PollResponse.countDocuments({ poll: pollId });
    const questionSummaries = await computeQuestionSummaries(pollId, poll);

    const deviceBreakdown = await PollResponse.aggregate([
      { $match: { poll: pollId } },
      { $group: { _id: "$device.type", count: { $sum: 1 } } },
    ]);

    const platformBreakdown = await PollResponse.aggregate([
      { $match: { poll: pollId } },
      { $group: { _id: "$device.browser", count: { $sum: 1 } } },
    ]);

    const pollAgeHours =
      (Date.now() - poll.createdAt.getTime()) / (1000 * 60 * 60);
    const velocityFormat =
      pollAgeHours <= 6
        ? "%Y-%m-%dT%H:%M:00Z"
        : pollAgeHours <= 48
          ? "%Y-%m-%dT%H:00:00Z"
          : "%Y-%m-%dT00:00:00Z";

    const responseVelocity = await PollResponse.aggregate([
      { $match: { poll: pollId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: velocityFormat,
              date: "$submittedAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const peakBucket = responseVelocity.reduce(
      (max, v) => (v.count > (max?.count ?? 0) ? v : max),
      null as { _id: string; count: number } | null,
    );

    const questionEngagement = poll.questions.map((q) => {
      const summary = questionSummaries.find(
        (s) => s.questionId === q._id.toString(),
      );
      return {
        questionId: q._id.toString(),
        questionText: q.text,
        isMandatory: q.isMandatory,
        responseCount: summary?.totalAnswers ?? 0,
        percentage:
          totalResponses > 0
            ? Math.round(((summary?.totalAnswers ?? 0) / totalResponses) * 100)
            : 0,
      };
    });

    const completionRate =
      poll.views > 0 ? Math.round((totalResponses / poll.views) * 100) : 0;
    const ageHours = (Date.now() - poll.createdAt.getTime()) / (1000 * 60 * 60);
    const responseRate =
      ageHours > 0 ? Math.round((totalResponses / ageHours) * 10) / 10 : 0;

    sendSuccess(res, {
      totalResponses,
      views: poll.views,
      completionRate,
      responseRate,
      questionSummaries,
      deviceBreakdown: deviceBreakdown.map((d) => ({
        type: d._id ?? "unknown",
        count: d.count,
        percentage:
          totalResponses > 0 ? Math.round((d.count / totalResponses) * 100) : 0,
      })),
      platformBreakdown: platformBreakdown.map((p) => ({
        name: p._id ?? "unknown",
        count: p.count,
        percentage:
          totalResponses > 0 ? Math.round((p.count / totalResponses) * 100) : 0,
      })),
      responseVelocity: responseVelocity.map((v) => ({
        timestamp: v._id,
        count: v.count,
      })),
      peakTime: peakBucket?._id ?? null,
      questionEngagement,
    });
  } catch (error) {
    next(error);
  }
};
