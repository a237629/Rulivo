import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { ScreenshotCandidates } from "./screenshot-parse.contract.js";
import { PrismaService } from "../database/prisma.service.js";
import { PrivateObjectStore } from "./private-object-store.js";
import { SCREENSHOT_PROMPT_VERSION, ScreenshotParser } from "./screenshot-parser.service.js";

@Injectable()
export class ScreenshotParsesService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PrivateObjectStore) private readonly objects: PrivateObjectStore,
    @Inject(ScreenshotParser) private readonly parser: ScreenshotParser
  ) {}

  public async create(userId: string, imageId: string) {
    const image = await this.prisma.tradeImage.findFirst({
      where: { id: imageId, userId },
      select: { id: true, mediaType: true, objectKey: true }
    });
    if (!image) throw new NotFoundException("Image not found");
    const candidates = await this.parser.parse(
      await this.objects.read(image.objectKey),
      image.mediaType
    );
    return this.prisma.screenshotParse.create({
      data: {
        tradeImageId: image.id,
        candidates,
        modelVersion: this.parser.modelVersion,
        promptVersion: SCREENSHOT_PROMPT_VERSION
      },
      select: {
        id: true,
        status: true,
        candidates: true,
        modelVersion: true,
        promptVersion: true,
        createdAt: true
      }
    });
  }

  public async confirm(userId: string, parseId: string, confirmedData: ScreenshotCandidates) {
    const parse = await this.prisma.screenshotParse.findFirst({
      where: { id: parseId, tradeImage: { userId } },
      select: { id: true, status: true }
    });
    if (!parse) throw new NotFoundException("Screenshot parse not found");
    if (parse.status !== "CANDIDATE")
      throw new ConflictException("Screenshot parse is already confirmed");
    return this.prisma.screenshotParse.update({
      where: { id: parse.id },
      data: { confirmedAt: new Date(), confirmedData, status: "CONFIRMED" },
      select: {
        id: true,
        status: true,
        candidates: true,
        confirmedData: true,
        modelVersion: true,
        promptVersion: true,
        confirmedAt: true
      }
    });
  }

  public async get(userId: string, parseId: string) {
    const parse = await this.prisma.screenshotParse.findFirst({
      where: { id: parseId, tradeImage: { userId } },
      select: {
        id: true,
        status: true,
        candidates: true,
        confirmedData: true,
        modelVersion: true,
        promptVersion: true,
        confirmedAt: true,
        createdAt: true
      }
    });
    if (!parse) throw new NotFoundException("Screenshot parse not found");
    return parse;
  }
}
