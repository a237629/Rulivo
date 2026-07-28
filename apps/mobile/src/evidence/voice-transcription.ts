export interface VoiceTranscription {
  candidateText: string;
  confirmedText: string | null;
  id: string;
  modelVersion: string;
  promptVersion: string;
  status: "CANDIDATE" | "CONFIRMED";
}

async function apiRequest<T>(
  path: string,
  accessToken: string,
  body?: unknown,
  method = "POST",
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    method
  });
  if (!response.ok) throw new Error(`Transcription request failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: T };
  if (!payload.data) throw new Error("Transcription response is invalid");
  return payload.data;
}

export function transcribeVoiceRecording(recordingId: string, accessToken: string) {
  return apiRequest<VoiceTranscription>(
    `/voice-recordings/${encodeURIComponent(recordingId)}/transcribe`,
    accessToken
  );
}

export function confirmVoiceTranscription(
  transcriptionId: string,
  text: string,
  accessToken: string
) {
  return apiRequest<VoiceTranscription>(
    `/voice-transcriptions/${encodeURIComponent(transcriptionId)}/confirm`,
    accessToken,
    { text }
  );
}

export function saveVoiceRetentionPreference(
  autoDeleteVoiceAfterTranscription: boolean,
  accessToken: string
) {
  return apiRequest<{ autoDeleteVoiceAfterTranscription: boolean }>(
    "/users/me/preferences/voice-retention",
    accessToken,
    { autoDeleteVoiceAfterTranscription },
    "PUT"
  );
}
