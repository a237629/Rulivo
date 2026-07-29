import { z } from "zod";

export const PATTERN_EXPLANATION_PROMPT_VERSION = "pattern-explanation-v1";

export const patternMetricNameSchema = z.enum([
  "SAMPLE_SIZE",
  "KNOWN_SAMPLE_SIZE",
  "PASS_COUNT",
  "FAIL_COUNT",
  "UNKNOWN_COUNT",
  "COUNTEREXAMPLE_COUNT",
  "EFFECT_SIZE",
  "DATA_COMPLETENESS",
  "CONFIDENCE_SCORE"
]);

const proseSchema = z
  .string()
  .trim()
  .min(1)
  .max(1_000)
  .regex(/^[^0-9０-９]*$/, "Numeric facts must be emitted as numeric_claims with an evidence_id");

export const patternExplanationOutputSchema = z
  .object({
    explanations: z
      .array(
        z
          .object({
            conclusion: proseSchema,
            limitations: z.array(proseSchema).max(5),
            numeric_claims: z
              .array(
                z
                  .object({
                    evidence_id: z.uuid(),
                    metric: patternMetricNameSchema,
                    value: z.number()
                  })
                  .strict()
              )
              .min(1)
              .max(9),
            pattern_type: z.enum([
              "LOSS_REENTRY",
              "POSITION_INCREASE",
              "MOVED_STOP",
              "DAILY_TRADE_LIMIT",
              "PLAN_DEVIATION"
            ])
          })
          .strict()
      )
      .min(1)
      .max(5)
  })
  .strict();

export const PATTERN_EXPLANATION_JSON_SCHEMA = z.toJSONSchema(patternExplanationOutputSchema, {
  target: "draft-07"
});

export type PatternExplanationOutput = z.infer<typeof patternExplanationOutputSchema>;
export type PatternMetricName = z.infer<typeof patternMetricNameSchema>;

export interface PatternExplanationMetricInput {
  algorithm_version: string;
  confidence_score: number;
  counterexample_count: number;
  data_completeness: number;
  dominant_status: string;
  effect_size: number;
  evidence_id: string;
  fail_count: number;
  known_sample_size: number;
  level: string;
  pass_count: number;
  pattern_type: PatternExplanationOutput["explanations"][number]["pattern_type"];
  sample_size: number;
  unknown_count: number;
}

const metricKeys: Record<PatternMetricName, keyof PatternExplanationMetricInput> = {
  CONFIDENCE_SCORE: "confidence_score",
  COUNTEREXAMPLE_COUNT: "counterexample_count",
  DATA_COMPLETENESS: "data_completeness",
  EFFECT_SIZE: "effect_size",
  FAIL_COUNT: "fail_count",
  KNOWN_SAMPLE_SIZE: "known_sample_size",
  PASS_COUNT: "pass_count",
  SAMPLE_SIZE: "sample_size",
  UNKNOWN_COUNT: "unknown_count"
};

export function validatePatternExplanation(
  value: unknown,
  metrics: PatternExplanationMetricInput[]
): PatternExplanationOutput {
  const output = patternExplanationOutputSchema.parse(value);
  if (output.explanations.length !== metrics.length) {
    throw new RangeError("AI output must contain exactly one explanation per metric");
  }
  const metricsByEvidence = new Map(metrics.map((metric) => [metric.evidence_id, metric]));
  const seenPatterns = new Set<string>();
  for (const explanation of output.explanations) {
    if (seenPatterns.has(explanation.pattern_type)) {
      throw new RangeError("AI output contains duplicate pattern explanations");
    }
    seenPatterns.add(explanation.pattern_type);
    const seenClaims = new Set<string>();
    for (const claim of explanation.numeric_claims) {
      const metric = metricsByEvidence.get(claim.evidence_id);
      if (metric?.pattern_type !== explanation.pattern_type) {
        throw new RangeError("AI output references unavailable evidence");
      }
      if (seenClaims.has(claim.metric)) {
        throw new RangeError("AI output contains duplicate numeric claims");
      }
      seenClaims.add(claim.metric);
      if (metric[metricKeys[claim.metric]] !== claim.value) {
        throw new RangeError("AI output numeric claim does not match calculated evidence");
      }
    }
  }
  for (const metric of metrics) {
    if (!seenPatterns.has(metric.pattern_type)) {
      throw new RangeError("AI output omitted a calculated metric");
    }
  }
  return output;
}
