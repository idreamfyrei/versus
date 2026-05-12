import { z } from "zod/v4";

const answerSchema = z.object({
  questionId: z.string().min(1).describe("The identifier of the answered question."),
  optionId: z.string().min(1).describe("The identifier of the selected option."),
}).describe("A selected option for a poll question.");

export const submitResponseSchema = z.object({
  answers: z
    .array(answerSchema)
    .min(1, "At least one answer is required")
    .describe("The answers submitted by a poll respondent."),
}).describe("Payload for submitting a poll response.");

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
