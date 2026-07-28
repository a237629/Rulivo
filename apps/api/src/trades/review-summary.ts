export const REVIEW_SUMMARY_VERSION = "review-summary-v1";

export interface ReviewEvidence {
  id: string;
  kind: "EXECUTION" | "RULE" | "VOICE";
  label: string;
  quote?: string;
}

interface ReviewInput {
  executions: {
    action: string;
    executedAt: Date;
    id: string;
    priceMinor: bigint;
    quantity: { toFixed(): string };
  }[];
  ruleResults: {
    explanation: string;
    id: string;
    playbookRule: { type: string };
    status: string;
  }[];
  side: string;
  symbol: string;
  voiceRecordings: {
    transcription: null | {
      confirmedText: null | string;
      candidateText: string;
      id: string;
      insightExtraction: null | { extractedData: unknown };
    };
  }[];
}

export interface StructuredReviewSummary {
  evidence: ReviewEvidence[];
  execution: { evidenceIds: string[]; text: string };
  overview: string;
  rules: { evidenceIds: string[]; text: string };
  voice: { evidenceIds: string[]; text: string };
}

function insightQuotes(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const quotes = (value as { evidenceQuotes?: unknown }).evidenceQuotes;
  return Array.isArray(quotes)
    ? quotes.filter((quote): quote is string => typeof quote === "string").slice(0, 3)
    : [];
}

export function buildReviewSummary(input: ReviewInput): StructuredReviewSummary {
  const executionEvidence = input.executions.map((execution) => ({
    id: execution.id,
    kind: "EXECUTION" as const,
    label: `${execution.action} ${execution.quantity.toFixed()} @ ${execution.priceMinor.toString()}`
  }));
  const ruleEvidence = input.ruleResults.map((result) => ({
    id: result.id,
    kind: "RULE" as const,
    label: `${result.playbookRule.type}: ${result.status}`,
    quote: result.explanation
  }));
  const voiceEvidence = input.voiceRecordings.flatMap((recording) => {
    if (recording.transcription === null) return [];
    const transcription = recording.transcription;
    const quotes = insightQuotes(transcription.insightExtraction?.extractedData);
    return quotes.map((quote, index) => ({
      id: `${transcription.id}:${String(index)}`,
      kind: "VOICE" as const,
      label: "User voice evidence",
      quote
    }));
  });
  const passCount = input.ruleResults.filter(({ status }) => status === "PASS").length;
  const failCount = input.ruleResults.filter(({ status }) => status === "FAIL").length;
  const unknownCount = input.ruleResults.filter(({ status }) => status === "UNKNOWN").length;

  return {
    evidence: [...executionEvidence, ...ruleEvidence, ...voiceEvidence],
    execution: {
      evidenceIds: executionEvidence.map(({ id }) => id),
      text:
        executionEvidence.length === 0
          ? "No execution evidence is available."
          : `${String(executionEvidence.length)} executions were recorded in chronological order.`
    },
    overview: `${input.symbol} ${input.side} review based only on recorded evidence.`,
    rules: {
      evidenceIds: ruleEvidence.map(({ id }) => id),
      text: `${String(passCount)} rules passed, ${String(failCount)} failed, and ${String(unknownCount)} remain unknown.`
    },
    voice: {
      evidenceIds: voiceEvidence.map(({ id }) => id),
      text:
        voiceEvidence.length === 0
          ? "No confirmed user voice evidence is available."
          : `${String(voiceEvidence.length)} user voice evidence quotes support this review.`
    }
  };
}
