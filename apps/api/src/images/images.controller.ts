import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthGuard, type AuthenticatedRequest } from "../auth/auth.guard.js";
import { ImagesService } from "./images.service.js";
import { MAX_IMAGE_BYTES } from "./image-processor.js";

const uploadSchema = z.object({
  consent: z.literal("true"),
  source: z.enum(["CAMERA", "LIBRARY"]),
  tradeId: z.uuid().optional()
});

@ApiTags("Images")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("images")
export class ImagesController {
  public constructor(private readonly images: ImagesService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  public upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined
  ) {
    const parsed = uploadSchema.safeParse(request.body);
    if (!file || !parsed.success)
      throw new BadRequestException("Image, explicit consent, and source are required");
    return this.images.upload(request.auth.userId, file, parsed.data.source, parsed.data.tradeId);
  }

  @Get(":imageId/content")
  @Header("Cache-Control", "private, no-store")
  public async content(@Req() request: AuthenticatedRequest, @Param("imageId") imageId: string) {
    if (!z.uuid().safeParse(imageId).success) throw new BadRequestException("Invalid image ID");
    const image = await this.images.content(request.auth.userId, imageId);
    return new StreamableFile(image.buffer, {
      type: image.mediaType,
      disposition: "inline",
      length: image.buffer.length
    });
  }
}
