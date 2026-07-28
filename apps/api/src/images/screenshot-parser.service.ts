import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  screenshotCandidatesSchema,
  type ScreenshotCandidates
} from "./screenshot-parse.contract.js";

export const SCREENSHOT_PROMPT_VERSION = "screenshot-extraction-v1";

@Injectable()
export class ScreenshotParser {
  public readonly modelVersion = process.env.SCREENSHOT_MODEL_NAME ?? "unconfigured";

  public async parse(image: Buffer, mediaType: string): Promise<ScreenshotCandidates> {
    const endpoint = process.env.SCREENSHOT_MODEL_ENDPOINT;
    const apiKey = process.env.SCREENSHOT_MODEL_API_KEY;
    if (!endpoint || !apiKey || this.modelVersion === "unconfigured") {
      throw new ServiceUnavailableException("Screenshot model is not configured");
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        body: JSON.stringify({
          image: `data:${mediaType};base64,${image.toString("base64")}`,
          model: this.modelVersion,
          prompt:
            "Extract candidate asset, LONG/SHORT direction, decimal price, timeframe, and visible annotations. Use null when a field is not visible. Return JSON only.",
          promptVersion: SCREENSHOT_PROMPT_VERSION
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(30_000)
      });
    } catch {
      throw new BadGatewayException("Screenshot model request failed");
    }
    if (!response.ok) throw new BadGatewayException("Screenshot model rejected the request");
    const parsed = screenshotCandidatesSchema.safeParse(await response.json());
    if (!parsed.success)
      throw new BadGatewayException("Screenshot model returned invalid candidates");
    return parsed.data;
  }
}
