import { afterEach, describe, expect, it, vi } from "vitest";
import { screenshotConfirmationSchema } from "./screenshot-parse.contract.js";
import { SCREENSHOT_PROMPT_VERSION, ScreenshotParser } from "./screenshot-parser.service.js";

describe("screenshot parsing contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCREENSHOT_MODEL_ENDPOINT;
    delete process.env.SCREENSHOT_MODEL_API_KEY;
    delete process.env.SCREENSHOT_MODEL_NAME;
  });

  it("requires every confirmation field to be present", () => {
    expect(
      screenshotConfirmationSchema.safeParse({
        annotations: [],
        asset: "AAPL",
        direction: "LONG",
        price: "201.25"
      }).success
    ).toBe(false);
    expect(
      screenshotConfirmationSchema.safeParse({
        annotations: ["breakout"],
        asset: "AAPL",
        direction: "LONG",
        price: "201.25",
        timeframe: "5m"
      }).success
    ).toBe(true);
  });

  it("validates structured candidates returned by the configured model", async () => {
    process.env.SCREENSHOT_MODEL_ENDPOINT = "https://model.example/parse";
    process.env.SCREENSHOT_MODEL_API_KEY = "test-key";
    process.env.SCREENSHOT_MODEL_NAME = "vision-test-2026-07";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            annotations: ["entry"],
            asset: "BTCUSDT",
            direction: "LONG",
            price: "64000.50",
            timeframe: "15m"
          }),
          { status: 200 }
        )
      )
    );
    const parser = new ScreenshotParser();
    const result = await parser.parse(Buffer.from("image"), "image/jpeg");
    expect(result.asset).toBe("BTCUSDT");
    expect(parser.modelVersion).toBe("vision-test-2026-07");
    expect(SCREENSHOT_PROMPT_VERSION).toBe("screenshot-extraction-v1");
  });

  it("fails closed when no regional model is configured", async () => {
    const parser = new ScreenshotParser();
    await expect(parser.parse(Buffer.from("image"), "image/jpeg")).rejects.toThrow(
      "Screenshot model is not configured"
    );
  });
});
