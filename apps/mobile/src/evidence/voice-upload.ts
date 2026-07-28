export interface PreparedVoiceRecording {
  durationMs: number;
  mediaType: "audio/mp4" | "audio/webm";
  uri: string;
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function uploadVoiceRecording(
  recording: PreparedVoiceRecording,
  accessToken: string,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<{ id: string }> {
  const body = new FormData();
  body.append("durationMs", String(recording.durationMs));
  body.append("file", {
    name: recording.mediaType === "audio/webm" ? "review.webm" : "review.m4a",
    type: recording.mediaType,
    uri: recording.uri
  });
  const response = await fetch(`${apiBaseUrl}/voice-recordings`, {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
    method: "POST"
  });
  if (!response.ok) throw new Error(`Voice upload failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: { id: string } };
  if (!payload.data) throw new Error("Voice upload response is invalid");
  return { id: payload.data.id };
}
