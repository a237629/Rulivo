import { z } from "zod";

const nullableText = z.string().trim().min(1).max(200).nullable();

export const screenshotCandidatesSchema = z.object({
  annotations: z.array(z.string().trim().min(1).max(500)).max(50),
  asset: nullableText,
  direction: z.enum(["LONG", "SHORT"]).nullable(),
  price: z
    .string()
    .regex(/^\d+(?:\.\d+)?$/)
    .nullable(),
  timeframe: nullableText
});

export const screenshotConfirmationSchema = screenshotCandidatesSchema;

export type ScreenshotCandidates = z.infer<typeof screenshotCandidatesSchema>;
