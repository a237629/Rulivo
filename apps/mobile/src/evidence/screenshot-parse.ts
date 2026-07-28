export interface ScreenshotFields {
  annotations: string[];
  asset: string | null;
  direction: "LONG" | "SHORT" | null;
  price: string | null;
  timeframe: string | null;
}

interface ParseResponse {
  data?: {
    candidates: ScreenshotFields;
    id: string;
    modelVersion: string;
    promptVersion: string;
  };
}

async function authenticatedJson<T>(
  path: string,
  accessToken: string,
  body?: ScreenshotFields,
  apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000"
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" })
    },
    method: "POST"
  });
  if (!response.ok) throw new Error(`Screenshot request failed (${String(response.status)})`);
  return (await response.json()) as T;
}

export async function parseScreenshot(imageId: string, accessToken: string) {
  const payload = await authenticatedJson<ParseResponse>(
    `/images/${encodeURIComponent(imageId)}/parse`,
    accessToken
  );
  if (!payload.data) throw new Error("Screenshot parse response is invalid");
  return payload.data;
}

export async function confirmScreenshotParse(
  parseId: string,
  fields: ScreenshotFields,
  accessToken: string
) {
  return authenticatedJson(
    `/screenshot-parses/${encodeURIComponent(parseId)}/confirm`,
    accessToken,
    fields
  );
}
