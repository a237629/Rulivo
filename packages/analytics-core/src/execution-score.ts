export type ExecutionDimension = "RULES" | "POSITION" | "STOP" | "PLAN" | "EMOTION";
export type ExecutionDimensionStatus = "PASS" | "FAIL" | "UNKNOWN";

export interface ExecutionScoreInput {
  dimension: ExecutionDimension;
  status: ExecutionDimensionStatus;
}

export interface ExecutionScore {
  coveragePercent: number;
  dimensions: {
    dimension: ExecutionDimension;
    points: 0 | 20 | null;
    status: ExecutionDimensionStatus;
  }[];
  executionScore: number | null;
  knownDimensions: number;
  totalDimensions: number;
}

function roundRatio(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}

export function calculateExecutionScore(inputs: readonly ExecutionScoreInput[]): ExecutionScore {
  const dimensions: ExecutionDimension[] = ["RULES", "POSITION", "STOP", "PLAN", "EMOTION"];
  const byDimension = new Map(inputs.map((input) => [input.dimension, input.status]));
  const results = dimensions.map((dimension) => {
    const status = byDimension.get(dimension) ?? "UNKNOWN";
    return {
      dimension,
      points: status === "UNKNOWN" ? null : status === "PASS" ? 20 : 0,
      status
    } as const;
  });
  const knownDimensions = results.filter(({ status }) => status !== "UNKNOWN").length;
  const passedDimensions = results.filter(({ status }) => status === "PASS").length;
  return {
    coveragePercent: roundRatio(knownDimensions * 100, dimensions.length),
    dimensions: results,
    executionScore:
      knownDimensions === 0 ? null : roundRatio(passedDimensions * 100, knownDimensions),
    knownDimensions,
    totalDimensions: dimensions.length
  };
}

export const EXECUTION_SCORE_VERSION = "execution-v1";
