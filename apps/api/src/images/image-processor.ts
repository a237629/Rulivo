import sharp from "sharp";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function sanitizeImage(input: Buffer) {
  const image = sharp(input, { failOn: "warning", limitInputPixels: 40_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }
  const buffer = await image
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const output = await sharp(buffer).metadata();
  return { buffer, height: output.height, width: output.width };
}
