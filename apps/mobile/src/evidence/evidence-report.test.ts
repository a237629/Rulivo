import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEvidenceReport, submitPatternExplanationFeedback } from "./evidence-report.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchEvidenceReport", () => {
  it("loads the authenticated evidence report", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { explanationId: "explanation-1", generatedFrom: "metrics", patterns: [] }
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchEvidenceReport("token", "https://api.example")).resolves.toMatchObject({
      patterns: []
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/analytics/evidence-report",
      expect.objectContaining({ headers: { Authorization: "Bearer token" } })
    );
  });

  it("submits one of the constrained correction reasons", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "feedback-1" } }), {
        headers: { "Content-Type": "application/json" },
        status: 201
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    await submitPatternExplanationFeedback(
      "explanation-1",
      "LOSS_REENTRY",
      "INACCURATE",
      "token",
      "https://api.example"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example/analytics/pattern-explanations/explanation-1/feedback",
      expect.objectContaining({
        body: JSON.stringify({ patternType: "LOSS_REENTRY", reason: "INACCURATE" }),
        method: "POST"
      })
    );
  });

  it("rejects an invalid response envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), {
          headers: { "Content-Type": "application/json" },
          status: 200
        })
      )
    );
    await expect(fetchEvidenceReport("token")).rejects.toThrow(/invalid/);
  });
});
