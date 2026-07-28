import { describe, expect, it } from "vitest";
import { formatDuration } from "./voice-upload";

describe("voice recording duration", () => {
  it("formats elapsed milliseconds as a stable minute clock", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65_999)).toBe("01:05");
    expect(formatDuration(3_599_000)).toBe("59:59");
  });
});
