import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import {
  PATTERN_EXPLANATION_JSON_SCHEMA,
  PATTERN_EXPLANATION_PROMPT_VERSION,
  type PatternExplanationMetricInput
} from "./pattern-explanation.contract.js";

@Injectable()
export class PatternExplanationModel {
  public readonly modelVersion = process.env.PATTERN_EXPLANATION_MODEL_NAME ?? "unconfigured";

  public async explain(metrics: PatternExplanationMetricInput[]): Promise<unknown> {
    const endpoint = process.env.PATTERN_EXPLANATION_MODEL_ENDPOINT;
    const apiKey = process.env.PATTERN_EXPLANATION_MODEL_API_KEY;
    if (!endpoint || !apiKey || this.modelVersion === "unconfigured") {
      throw new ServiceUnavailableException("Pattern explanation model is not configured");
    }
    let response: Response;
    try {
      response = await fetch(endpoint, {
        body: JSON.stringify({
          input: { calculated_metrics: metrics },
          model: this.modelVersion,
          prompt:
            "Explain only the supplied calculated_metrics. Do not calculate or infer new numeric facts. Put every numeric fact in numeric_claims with the exact supplied value and evidence_id. Keep prose free of digits. State uncertainty and limitations without financial advice.",
          promptVersion: PATTERN_EXPLANATION_PROMPT_VERSION,
          responseSchema: PATTERN_EXPLANATION_JSON_SCHEMA
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(30_000)
      });
    } catch {
      throw new BadGatewayException("Pattern explanation model request failed");
    }
    if (!response.ok)
      throw new BadGatewayException("Pattern explanation model rejected the request");
    return response.json();
  }
}
