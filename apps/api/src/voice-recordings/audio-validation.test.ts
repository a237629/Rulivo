import { describe, expect, it } from "vitest";
import { validateAudio } from "./audio-validation.js";

describe("voice recording validation", () => {
  it("accepts an M4A/MP4 container with a matching media type", () => {
    const buffer = Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20]);
    expect(validateAudio(buffer, "audio/m4a")).toEqual({
      extension: "m4a",
      mediaType: "audio/mp4"
    });
  });

  it("accepts a WebM container with a matching media type", () => {
    const buffer = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01]);
    expect(validateAudio(buffer, "audio/webm;codecs=opus")).toEqual({
      extension: "webm",
      mediaType: "audio/webm"
    });
  });

  it("rejects a mismatched or invalid file", () => {
    expect(() => validateAudio(Buffer.from("not audio"), "audio/mp4")).toThrow(
      "Only valid M4A or WebM audio is supported"
    );
  });
});
