import { describe, expect, it, vi } from "vitest";
import {
  answerTradeFollowUp,
  calculateTradeExecutionScore,
  calculateTradeResultScore,
  createTradeNote,
  fetchTradeDetail,
  evaluateTradeQuadrant,
  fetchTradeReviewSummary,
  generateTradeReviewSummary,
  startTradeFollowUp
} from "./trade-detail";

describe("mobile trade-detail API", () => {
  it("encodes the trade id and sends bearer authentication", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: { id: "a/b" } }) });
    vi.stubGlobal("fetch", fetchMock);
    void (await fetchTradeDetail("a/b", "token"));
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/trades/a%2Fb");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("Bearer token");
    vi.unstubAllGlobals();
  });

  it("sends note text as JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await createTradeNote("trade", "review", "token");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ body: "review" })
      })
    );
    vi.unstubAllGlobals();
  });

  it("sends the planned target for result scoring", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await calculateTradeResultScore("trade", "2.000000", "token");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/result-score");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("2.000000");
    vi.unstubAllGlobals();
  });

  it("requests evidence-backed execution scoring", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await calculateTradeExecutionScore("trade", "token");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/execution-score");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("PUT");
    vi.unstubAllGlobals();
  });

  it("requests the evidence-backed quadrant evaluation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await evaluateTradeQuadrant("trade", "token");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/quadrant");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("PUT");
    vi.unstubAllGlobals();
  });

  it("starts and answers a bounded follow-up session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    await startTradeFollowUp("trade", "token");
    await answerTradeFollowUp("session", { selectedOption: "YES" }, "token");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/follow-ups");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/answers");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("selectedOption");
    vi.unstubAllGlobals();
  });

  it("generates and reads the evidence-backed review summary", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: null }) });
    vi.stubGlobal("fetch", fetchMock);
    await generateTradeReviewSummary("trade", "token");
    await fetchTradeReviewSummary("trade", "token");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("/review-summary");
    expect(JSON.stringify(fetchMock.mock.calls)).toContain("PUT");
    vi.unstubAllGlobals();
  });
});
