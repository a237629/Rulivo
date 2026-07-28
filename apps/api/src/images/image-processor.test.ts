import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { sanitizeImage } from "./image-processor.js";

describe("sanitizeImage", () => {
  it("normalizes, limits dimensions, and removes metadata", async () => {
    const input = await sharp({
      create: { width: 3000, height: 1500, channels: 3, background: "#ff0000" }
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const result = await sanitizeImage(input);
    const metadata = await sharp(result.buffer).metadata();
    expect(result.width).toBeLessThanOrEqual(2048);
    expect(result.height).toBeLessThanOrEqual(2048);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.format).toBe("jpeg");
  });

  it("rejects non-images", async () => {
    await expect(sanitizeImage(Buffer.from("not an image"))).rejects.toThrow();
  });
});
