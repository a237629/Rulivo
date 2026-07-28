export interface VoiceInsights {
  emotions: string[];
  entryReason: string | null;
  evidenceQuotes: string[];
  planDeviation: {
    explanation: string | null;
    status: "YES" | "NO" | "UNKNOWN";
  };
  strategy: string | null;
}

export interface VoiceInsightResponse {
  extractedData: VoiceInsights;
  id: string;
  modelVersion: string;
  promptVersion: string;
  safetyBoundary: string;
}

async function authenticatedRequest<T>(
  path: string,
  accessToken: string,
  method: "GET" | "POST",
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method
  });
  if (!response.ok) throw new Error(`Voice insight request failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: T };
  if (!payload.data) throw new Error("Voice insight response is invalid");
  return payload.data;
}

export function extractVoiceInsights(transcriptionId: string, accessToken: string) {
  return authenticatedRequest<VoiceInsightResponse>(
    `/voice-transcriptions/${encodeURIComponent(transcriptionId)}/insights`,
    accessToken,
    "POST"
  );
}

export function getVoiceInsights(insightId: string, accessToken: string) {
  return authenticatedRequest<VoiceInsightResponse>(
    `/voice-insights/${encodeURIComponent(insightId)}`,
    accessToken,
    "GET"
  );
}
