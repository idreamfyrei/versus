import { z } from "zod/v4";

const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens",
  )
  .describe(
    "A URL-friendly poll slug using lowercase letters, numbers, and hyphens.",
  );

const optionInputSchema = z.object({
  text: z
    .string()
    .min(1, "Option text is required")
    .max(500)
    .describe("The display text for a selectable poll option."),
}).describe("A selectable option for a poll question.");

const questionInputSchema = z.object({
  text: z
    .string()
    .min(1, "Question text is required")
    .max(1000)
    .describe("The question prompt shown to poll respondents."),
  options: z
    .array(optionInputSchema)
    .min(2, "At least 2 options required")
    .max(20)
    .describe("The available options respondents can choose from."),
  isMandatory: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether respondents must answer this question before submitting."),
}).describe("A question included in a poll.");

export const createPollSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200)
    .describe("The poll title shown to respondents."),
  description: z
    .string()
    .max(2000)
    .optional()
    .describe("Optional supporting text that explains the poll context."),
  questions: z
    .array(questionInputSchema)
    .min(1, "At least 1 question required")
    .max(50)
    .describe("The questions respondents will answer in this poll."),
  isAnonymous: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether respondent identities should be hidden from poll results."),
  showCreatorName: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to show the creator name on the public poll page."),
  enableToast: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to show toast notifications for poll activity."),
  slug: slugSchema.optional().describe("Optional custom URL slug for the poll."),
  expiresAt: z
    .string()
    .pipe(z.iso.datetime())
    .refine(
      (val) => new Date(val) > new Date(),
      "Expiry must be in the future",
    )
    .describe("The ISO datetime when the poll should expire."),
}).describe("Payload for creating a poll.");

export const claimPollSchema = z.object({
  shareId: z.string().min(1).describe("The public share identifier of the poll."),
  adminKey: z.string().min(1).describe("The admin key used to claim poll ownership."),
}).describe("Payload for claiming ownership of an anonymous poll.");

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type ClaimPollInput = z.infer<typeof claimPollSchema>;
