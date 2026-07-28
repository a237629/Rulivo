export interface TradeDetail {
  id: string;
  symbol: string;
  market: string | null;
  side: "LONG" | "SHORT";
  currency: string;
  resultScore: {
    calculatedAt: string;
    method: {
      version: string;
      formula: string;
      riskAdjusted: string;
      targetAchievement: string;
      outcome: string;
    };
    plannedTargetRMultiple: string;
    score: number;
    version: string;
  } | null;
  executionScore: {
    calculatedAt: string | null;
    coveragePercent: number;
    dimensions: {
      dimension: "RULES" | "POSITION" | "STOP" | "PLAN" | "EMOTION";
      points: 0 | 20 | null;
      status: "PASS" | "FAIL" | "UNKNOWN";
    }[];
    method: { version: string; formula: string; unknownPolicy: string };
    score: number | null;
    version: string | null;
  };
  quadrant: {
    calculatedAt: string | null;
    disciplineAxis: "FOLLOWED" | "VIOLATED" | "UNKNOWN";
    profitAxis: "PROFIT" | "LOSS" | "UNKNOWN";
    reason: string;
    value: "EXCELLENT" | "QUALIFIED" | "DANGEROUS" | "ERROR" | "UNKNOWN" | null;
    version: string | null;
  };
  chart: {
    kind: "EXECUTION_PRICE";
    priceMinMinor: string | null;
    priceMaxMinor: string | null;
    points: {
      executionId: string;
      action: string;
      timestamp: string;
      priceMinor: string;
      quantity: string;
    }[];
  };
  executions: {
    id: string;
    sequence: number;
    action: string;
    executedAt: string;
    quantity: string;
    priceMinor: string;
  }[];
  screenshots: {
    id: string;
    mediaType: string;
    contentPath: string;
    latestParseStatus: string | null;
  }[];
  notes: { id: string; body: string; createdAt: string; updatedAt: string }[];
  voiceRecordings: {
    id: string;
    mediaType: string;
    durationMs: number;
    contentPath: string | null;
    transcription: { status: string; text: string } | null;
  }[];
  ruleResults: {
    id: string;
    ruleType: string;
    status: string;
    explanation: string;
    confidence: string;
  }[];
}

const baseUrl = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const headers = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json"
});

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Trade detail request failed (${String(response.status)})`);
  const payload = (await response.json()) as { data?: T };
  if (payload.data === undefined) throw new Error("Trade detail response is invalid");
  return payload.data;
}

export async function fetchTradeDetail(tradeId: string, accessToken: string): Promise<TradeDetail> {
  return unwrap<TradeDetail>(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}`, {
      headers: headers(accessToken)
    })
  );
}

export async function createTradeNote(tradeId: string, body: string, accessToken: string) {
  return unwrap(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/notes`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify({ body })
    })
  );
}

export async function updateTradeNote(
  tradeId: string,
  noteId: string,
  body: string,
  accessToken: string
) {
  return unwrap(
    await fetch(
      `${baseUrl()}/trades/${encodeURIComponent(tradeId)}/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PATCH",
        headers: headers(accessToken),
        body: JSON.stringify({ body })
      }
    )
  );
}

export async function deleteTradeNote(tradeId: string, noteId: string, accessToken: string) {
  return unwrap(
    await fetch(
      `${baseUrl()}/trades/${encodeURIComponent(tradeId)}/notes/${encodeURIComponent(noteId)}`,
      {
        method: "DELETE",
        headers: headers(accessToken)
      }
    )
  );
}

export async function calculateTradeResultScore(
  tradeId: string,
  plannedTargetRMultiple: string,
  accessToken: string
) {
  return unwrap(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/result-score`, {
      method: "PUT",
      headers: headers(accessToken),
      body: JSON.stringify({ plannedTargetRMultiple })
    })
  );
}

export async function calculateTradeExecutionScore(tradeId: string, accessToken: string) {
  return unwrap(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/execution-score`, {
      method: "PUT",
      headers: headers(accessToken)
    })
  );
}

export async function evaluateTradeQuadrant(tradeId: string, accessToken: string) {
  return unwrap(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/quadrant`, {
      method: "PUT",
      headers: headers(accessToken)
    })
  );
}

export interface FollowUpSession {
  currentQuestion: {
    evidenceKey: string;
    id: string;
    question: string;
    quickOptions: string[];
    round: number;
  } | null;
  currentRound: number;
  id: string;
  maxRounds: 3;
  status: "ACTIVE" | "COMPLETED" | "MAX_ROUNDS";
  version: "follow-up-v1";
}

export async function startTradeFollowUp(
  tradeId: string,
  accessToken: string
): Promise<FollowUpSession> {
  return unwrap<FollowUpSession>(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/follow-ups`, {
      method: "POST",
      headers: headers(accessToken)
    })
  );
}

export async function answerTradeFollowUp(
  sessionId: string,
  answer: { freeText: string } | { selectedOption: string },
  accessToken: string
): Promise<FollowUpSession> {
  return unwrap<FollowUpSession>(
    await fetch(`${baseUrl()}/follow-ups/${encodeURIComponent(sessionId)}/answers`, {
      method: "POST",
      headers: headers(accessToken),
      body: JSON.stringify(answer)
    })
  );
}

export interface TradeReviewSummary {
  generatedAt: string;
  generatorVersion: "review-summary-v1";
  summary: {
    evidence: {
      id: string;
      kind: "EXECUTION" | "RULE" | "VOICE";
      label: string;
      quote?: string;
    }[];
    execution: { evidenceIds: string[]; text: string };
    overview: string;
    rules: { evidenceIds: string[]; text: string };
    voice: { evidenceIds: string[]; text: string };
  };
}

export async function generateTradeReviewSummary(
  tradeId: string,
  accessToken: string
): Promise<TradeReviewSummary> {
  return unwrap<TradeReviewSummary>(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/review-summary`, {
      method: "PUT",
      headers: headers(accessToken)
    })
  );
}

export async function fetchTradeReviewSummary(
  tradeId: string,
  accessToken: string
): Promise<TradeReviewSummary | null> {
  return unwrap<TradeReviewSummary | null>(
    await fetch(`${baseUrl()}/trades/${encodeURIComponent(tradeId)}/review-summary`, {
      headers: headers(accessToken)
    })
  );
}
