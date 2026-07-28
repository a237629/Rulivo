import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { z } from "zod";

const responseSchema = z.object({ text: z.string().trim().min(1).max(100_000) });
export const TRANSCRIPTION_PROMPT_VERSION = "voice-transcription-v1";

@Injectable()
export class SpeechToTextService {
  public readonly modelVersion = process.env.TRANSCRIPTION_MODEL_NAME ?? "unconfigured";

  public async transcribe(audio: Buffer, mediaType: string): Promise<string> {
    const endpoint = process.env.TRANSCRIPTION_MODEL_ENDPOINT;
    const apiKey = process.env.TRANSCRIPTION_MODEL_API_KEY;
    if (!endpoint || !apiKey || this.modelVersion === "unconfigured") {
      throw new ServiceUnavailableException("Transcription model is not configured");
    }
    let response: Response;
    try {
      response = await fetch(endpoint, {
        body: JSON.stringify({
          audio: `data:${mediaType};base64,${audio.toString("base64")}`,
          model: this.modelVersion,
          promptVersion: TRANSCRIPTION_PROMPT_VERSION
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(60_000)
      });
    } catch {
      throw new BadGatewayException("Transcription model request failed");
    }
    if (!response.ok) throw new BadGatewayException("Transcription model rejected the request");
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw new BadGatewayException("Transcription model returned invalid text");
    return parsed.data.text;
  }
}
