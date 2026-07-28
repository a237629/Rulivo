import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechToTextService, TRANSCRIPTION_PROMPT_VERSION } from "./speech-to-text.service.js";

describe("speech-to-text provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TRANSCRIPTION_MODEL_ENDPOINT;
    delete process.env.TRANSCRIPTION_MODEL_API_KEY;
    delete process.env.TRANSCRIPTION_MODEL_NAME;
  });

  it("fails closed when the regional provider is not configured", async () => {
    await expect(
      new SpeechToTextService().transcribe(Buffer.from("audio"), "audio/mp4")
    ).rejects.toThrow("Transcription model is not configured");
  });

  it("validates and returns candidate text with version provenance", async () => {
    process.env.TRANSCRIPTION_MODEL_ENDPOINT = "https://speech.example/transcribe";
    process.env.TRANSCRIPTION_MODEL_API_KEY = "test-key";
    process.env.TRANSCRIPTION_MODEL_NAME = "speech-test-2026-07";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ text: "I followed my stop plan." }), { status: 200 })
        )
    );
    const service = new SpeechToTextService();
    await expect(service.transcribe(Buffer.from("audio"), "audio/mp4")).resolves.toBe(
      "I followed my stop plan."
    );
    expect(service.modelVersion).toBe("speech-test-2026-07");
    expect(TRANSCRIPTION_PROMPT_VERSION).toBe("voice-transcription-v1");
  });

  it("rejects empty provider output", async () => {
    process.env.TRANSCRIPTION_MODEL_ENDPOINT = "https://speech.example/transcribe";
    process.env.TRANSCRIPTION_MODEL_API_KEY = "test-key";
    process.env.TRANSCRIPTION_MODEL_NAME = "speech-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: "" }), { status: 200 }))
    );
    await expect(
      new SpeechToTextService().transcribe(Buffer.from("audio"), "audio/mp4")
    ).rejects.toThrow("Transcription model returned invalid text");
  });
});
