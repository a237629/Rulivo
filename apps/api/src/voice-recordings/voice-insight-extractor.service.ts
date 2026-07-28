import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { voiceInsightSchema, type VoiceInsight } from "./voice-insight.contract.js";

export const VOICE_INSIGHT_PROMPT_VERSION = "voice-insight-extraction-v1";
export const VOICE_INSIGHT_SAFETY_BOUNDARY =
  "Behavioral reflection only; no medical or psychological diagnosis.";

@Injectable()
export class VoiceInsightExtractor {
  public readonly modelVersion = process.env.INSIGHT_MODEL_NAME ?? "unconfigured";

  public async extract(confirmedText: string): Promise<VoiceInsight> {
    const endpoint = process.env.INSIGHT_MODEL_ENDPOINT;
    const apiKey = process.env.INSIGHT_MODEL_API_KEY;
    if (!endpoint || !apiKey || this.modelVersion === "unconfigured") {
      throw new ServiceUnavailableException("Insight model is not configured");
    }
    let response: Response;
    try {
      response = await fetch(endpoint, {
        body: JSON.stringify({
          model: this.modelVersion,
          prompt:
            "Extract only explicitly stated emotions, entry reason, strategy, and plan deviation from the confirmed trading note. Include short evidence quotes. Use UNKNOWN or null when unsupported. Never provide a medical or psychological diagnosis.",
          promptVersion: VOICE_INSIGHT_PROMPT_VERSION,
          text: confirmedText
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(30_000)
      });
    } catch {
      throw new BadGatewayException("Insight model request failed");
    }
    if (!response.ok) throw new BadGatewayException("Insight model rejected the request");
    const parsed = voiceInsightSchema.safeParse(await response.json());
    if (!parsed.success)
      throw new BadGatewayException("Insight model returned unsafe or invalid data");
    return parsed.data;
  }
}
