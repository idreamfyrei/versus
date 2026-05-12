import { z } from "zod/v4";

export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens",
  );

const optionInputSchema = z.object({
  text: z.string().min(1, "Option text is required").max(500),
});

const questionInputSchema = z.object({
  text: z.string().min(1, "Question text is required").max(1000),
  options: z
    .array(optionInputSchema)
    .min(2, "At least 2 options required")
    .max(20),
  isMandatory: z.boolean().optional().default(true),
});

export const createPollSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  questions: z
    .array(questionInputSchema)
    .min(1, "At least 1 question required")
    .max(50),
  isAnonymous: z.boolean().optional().default(false),
  showCreatorName: z.boolean().optional().default(false),
  enableToast: z.boolean().optional().default(false),
  slug: slugSchema.optional(),
  expiresAt: z
    .string()
    .pipe(z.iso.datetime())
    .refine(
      (val) => new Date(val) > new Date(),
      "Expiry must be in the future",
    ),
});

export const updatePollSchema = createPollSchema.partial();

export const claimPollSchema = z.object({
  shareId: z.string().min(1),
  adminKey: z.string().min(1),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type ClaimPollInput = z.infer<typeof claimPollSchema>;
