import { randomUUID } from "node:crypto";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";
import { sanitizeImage } from "./image-processor.js";
import { PrivateObjectStore } from "./private-object-store.js";

@Injectable()
export class ImagesService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PrivateObjectStore) private readonly objects: PrivateObjectStore
  ) {}

  public async upload(
    userId: string,
    file: Express.Multer.File,
    source: "CAMERA" | "LIBRARY",
    tradeId?: string
  ) {
    if (tradeId) {
      const trade = await this.prisma.trade.findFirst({
        where: { id: tradeId, userId },
        select: { id: true }
      });
      if (!trade) throw new NotFoundException("Trade not found");
    }
    let processed;
    try {
      processed = await sanitizeImage(file.buffer);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "Invalid image");
    }
    const id = randomUUID();
    const objectKey = `${userId}/${id}.jpg`;
    await this.objects.put(objectKey, processed.buffer);
    try {
      return await this.prisma.tradeImage.create({
        data: {
          id,
          userId,
          tradeId: tradeId ?? null,
          objectKey,
          originalFileName: file.originalname.slice(0, 255),
          mediaType: "image/jpeg",
          sizeBytes: processed.buffer.length,
          width: processed.width,
          height: processed.height,
          source,
          consentedAt: new Date(),
          exifRemoved: true
        },
        select: {
          id: true,
          tradeId: true,
          mediaType: true,
          sizeBytes: true,
          width: true,
          height: true,
          source: true,
          consentedAt: true,
          exifRemoved: true,
          createdAt: true
        }
      });
    } catch (error) {
      await this.objects.remove(objectKey);
      throw error;
    }
  }

  public async content(userId: string, imageId: string) {
    const image = await this.prisma.tradeImage.findFirst({
      where: { id: imageId, userId },
      select: { objectKey: true, mediaType: true }
    });
    if (!image) throw new NotFoundException("Image not found");
    return { buffer: await this.objects.read(image.objectKey), mediaType: image.mediaType };
  }
}
