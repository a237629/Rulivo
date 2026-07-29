import { afterEach, describe, expect, it, vi } from "vitest";
import { PatternExplanationModel } from "./pattern-explanation-model.service.js";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PATTERN_EXPLANATION_MODEL_API_KEY;
  delete process.env.PATTERN_EXPLANATION_MODEL_ENDPOINT;
  delete process.env.PATTERN_EXPLANATION_MODEL_NAME;
});

describe("PatternExplanationModel", () => {
  it("sends only calculated metrics together with the strict response schema", async () => {
    process.env.PATTERN_EXPLANATION_MODEL_API_KEY = "secret";
    process.env.PATTERN_EXPLANATION_MODEL_ENDPOINT = "https://model.example/explain";
    process.env.PATTERN_EXPLANATION_MODEL_NAME = "reasoning-model";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ explanations: [] }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const model = new PatternExplanationModel();
    const metrics = [
      {
        algorithm_version: "pattern-confidence-v1",
        confidence_score: 0,
        counterexample_count: 0,
        data_completeness: 1,
        dominant_status: "FAIL",
        effect_size: 1,
        evidence_id: "0770fc2c-e379-4c09-9813-316d06b35c17",
        fail_count: 1,
        known_sample_size: 1,
        level: "INSUFFICIENT",
        pass_count: 0,
        pattern_type: "LOSS_REENTRY" as const,
        sample_size: 1,
        unknown_count: 0
      }
    ];

    await model.explain(metrics);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const bodyText = typeof init.body === "string" ? init.body : "";
    const body = JSON.parse(bodyText) as Record<string, unknown>;
    expect(body.input).toEqual({ calculated_metrics: metrics });
    expect(body).toHaveProperty("responseSchema");
    expect(JSON.stringify(body)).not.toContain("tradeId");
    expect(JSON.stringify(body)).not.toContain("input_data");
    expect(JSON.stringify(body)).not.toContain("output_data");
  });
});
