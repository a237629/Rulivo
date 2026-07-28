import { afterEach, describe, expect, it, vi } from "vitest";
import { voiceInsightSchema } from "./voice-insight.contract.js";
import {
  VOICE_INSIGHT_PROMPT_VERSION,
  VOICE_INSIGHT_SAFETY_BOUNDARY,
  VoiceInsightExtractor
} from "./voice-insight-extractor.service.js";

const validInsight = {
  emotions: ["frustrated"],
  entryReason: "Price broke the prior high",
  evidenceQuotes: ["I felt frustrated", "I entered on the breakout"],
  planDeviation: { explanation: "Entered before confirmation", status: "YES" },
  strategy: "breakout"
};

describe("voice insight extraction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.INSIGHT_MODEL_ENDPOINT;
    delete process.env.INSIGHT_MODEL_API_KEY;
    delete process.env.INSIGHT_MODEL_NAME;
  });

  it("accepts behavioral observations and rejects diagnostic claims", () => {
    expect(voiceInsightSchema.safeParse(validInsight).success).toBe(true);
    expect(
      voiceInsightSchema.safeParse({
        ...validInsight,
        emotions: ["The user has depression"]
      }).success
    ).toBe(false);
  });

  it("fails closed without a regional model configuration", async () => {
    await expect(new VoiceInsightExtractor().extract("confirmed note")).rejects.toThrow(
      "Insight model is not configured"
    );
  });

  it("returns strict evidence-backed extraction with safety provenance", async () => {
    process.env.INSIGHT_MODEL_ENDPOINT = "https://insight.example/extract";
    process.env.INSIGHT_MODEL_API_KEY = "test-key";
    process.env.INSIGHT_MODEL_NAME = "behavior-test-2026-07";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(validInsight), {
          status: 200
        })
      )
    );
    const extractor = new VoiceInsightExtractor();
    await expect(extractor.extract("confirmed note")).resolves.toEqual(validInsight);
    expect(extractor.modelVersion).toBe("behavior-test-2026-07");
    expect(VOICE_INSIGHT_PROMPT_VERSION).toBe("voice-insight-extraction-v1");
    expect(VOICE_INSIGHT_SAFETY_BOUNDARY).toContain("no medical or psychological diagnosis");
  });
});
