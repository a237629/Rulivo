import { describe, expect, it } from "vitest";
import {
  PATTERN_EXPLANATION_JSON_SCHEMA,
  validatePatternExplanation,
  type PatternExplanationMetricInput
} from "./pattern-explanation.contract.js";

const metric: PatternExplanationMetricInput = {
  algorithm_version: "pattern-confidence-v1",
  confidence_score: 83,
  counterexample_count: 2,
  data_completeness: 0.8,
  dominant_status: "FAIL",
  effect_size: 0.8,
  evidence_id: "0770fc2c-e379-4c09-9813-316d06b35c17",
  fail_count: 18,
  known_sample_size: 20,
  level: "HIGH",
  pass_count: 2,
  pattern_type: "LOSS_REENTRY",
  sample_size: 25,
  unknown_count: 5
};

describe("pattern explanation contract", () => {
  it("publishes a strict JSON Schema and accepts evidence-linked calculated numbers", () => {
    expect(PATTERN_EXPLANATION_JSON_SCHEMA).toMatchObject({
      additionalProperties: false,
      type: "object"
    });
    expect(
      validatePatternExplanation(
        {
          explanations: [
            {
              conclusion: "亏损后再次入场的失败行为占主导。",
              limitations: ["当前结论仅代表已记录样本。"],
              numeric_claims: [
                {
                  evidence_id: metric.evidence_id,
                  metric: "CONFIDENCE_SCORE",
                  value: 83
                }
              ],
              pattern_type: "LOSS_REENTRY"
            }
          ]
        },
        [metric]
      )
    ).toBeDefined();
  });

  it("rejects prose numbers, invented values, and unknown evidence IDs", () => {
    const output = {
      explanations: [
        {
          conclusion: "置信度为 90。",
          limitations: [],
          numeric_claims: [
            {
              evidence_id: metric.evidence_id,
              metric: "CONFIDENCE_SCORE",
              value: 90
            }
          ],
          pattern_type: "LOSS_REENTRY"
        }
      ]
    };
    expect(() => validatePatternExplanation(output, [metric])).toThrow();
    const explanation = output.explanations[0];
    const claim = explanation?.numeric_claims[0];
    if (explanation === undefined || claim === undefined) throw new Error("Invalid test fixture");
    explanation.conclusion = "失败行为占主导。";
    expect(() => validatePatternExplanation(output, [metric])).toThrow(/does not match/);
    claim.value = 83;
    claim.evidence_id = "d7c11d25-6aa7-4090-8a79-0954ff8e36d2";
    expect(() => validatePatternExplanation(output, [metric])).toThrow(/unavailable evidence/);
  });
});
