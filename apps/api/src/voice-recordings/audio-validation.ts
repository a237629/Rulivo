export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export function validateAudio(
  buffer: Buffer,
  mediaType: string
): { extension: "m4a" | "webm"; mediaType: "audio/mp4" | "audio/webm" } {
  const isMp4 = buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  const isWebm =
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3;
  if (isMp4 && ["audio/mp4", "audio/m4a", "audio/x-m4a"].includes(mediaType)) {
    return { extension: "m4a", mediaType: "audio/mp4" };
  }
  if (isWebm && mediaType.startsWith("audio/webm")) {
    return { extension: "webm", mediaType: "audio/webm" };
  }
  throw new Error("Only valid M4A or WebM audio is supported");
}
