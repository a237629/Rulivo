export interface PreparedImage {
  fileName: string;
  height: number;
  source: "CAMERA" | "LIBRARY";
  uri: string;
  width: number;
}

export async function uploadPreparedImage(
  image: PreparedImage,
  accessToken: string,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<{ id: string }> {
  const body = new FormData();
  body.append("consent", "true");
  body.append("source", image.source);
  body.append("file", {
    name: image.fileName,
    type: "image/jpeg",
    uri: image.uri
  });
  const response = await fetch(`${apiBaseUrl}/images`, {
    body,
    headers: { Authorization: `Bearer ${accessToken}` },
    method: "POST"
  });
  if (!response.ok) throw new Error(`Image upload failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: { id: string }; id?: string };
  const result = payload.data ?? payload;
  if (result.id === undefined) throw new Error("Image upload response is invalid");
  return { id: result.id };
}
