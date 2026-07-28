import { z } from "zod";

const diagnosticLanguage =
  /diagnos|disorder|depress(?:ion|ive)|bipolar|psychosis|mental illness|抑郁症|焦虑症|双相|精神病|心理诊断|医疗诊断/i;
const safeText = z
  .string()
  .trim()
  .min(1)
  .max(2_000)
  .refine((value) => !diagnosticLanguage.test(value), "Diagnostic language is not allowed");

export const voiceInsightSchema = z
  .object({
    emotions: z.array(safeText.max(100)).max(10),
    entryReason: safeText.nullable(),
    evidenceQuotes: z.array(safeText.max(500)).max(10),
    planDeviation: z.object({
      explanation: safeText.nullable(),
      status: z.enum(["YES", "NO", "UNKNOWN"])
    }),
    strategy: safeText.nullable()
  })
  .strict();

export type VoiceInsight = z.infer<typeof voiceInsightSchema>;
