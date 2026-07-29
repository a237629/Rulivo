import { z } from "zod";

export const patternExplanationFeedbackSchema = z
  .object({
    comment: z.string().trim().min(1).max(1_000).optional(),
    patternType: z.enum([
      "LOSS_REENTRY",
      "POSITION_INCREASE",
      "MOVED_STOP",
      "DAILY_TRADE_LIMIT",
      "PLAN_DEVIATION"
    ]),
    reason: z.enum(["INACCURATE", "UNHELPFUL", "EVIDENCE_ERROR", "TONE_INAPPROPRIATE"])
  })
  .strict();

export type PatternExplanationFeedbackInput = z.infer<typeof patternExplanationFeedbackSchema>;
