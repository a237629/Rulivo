export const PATTERN_CONFIDENCE_VERSION = "pattern-confidence-v1";
export const PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE = 10;
export const PATTERN_CONFIDENCE_TARGET_SAMPLE_SIZE = 30;

export type PatternConfidenceLevel = "INSUFFICIENT" | "LOW" | "MEDIUM" | "HIGH";
export type PatternDominantStatus = "BALANCED" | "FAIL" | "PASS" | "UNKNOWN";

export interface PatternConfidenceInput {
  failCount: number;
  passCount: number;
  unknownCount: number;
}

export interface PatternConfidence {
  confidenceScore: number;
  counterexampleCount: number;
  dataCompleteness: number;
  dominantStatus: PatternDominantStatus;
  effectSize: number;
  failCount: number;
  knownSampleSize: number;
  level: PatternConfidenceLevel;
  passCount: number;
  sampleSize: number;
  unknownCount: number;
}

function assertCount(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

function roundRatio(value: number): number {
  return Number(value.toFixed(6));
}

export function calculatePatternConfidence(input: PatternConfidenceInput): PatternConfidence {
  assertCount("failCount", input.failCount);
  assertCount("passCount", input.passCount);
  assertCount("unknownCount", input.unknownCount);

  const knownSampleSize = input.failCount + input.passCount;
  const sampleSize = knownSampleSize + input.unknownCount;
  const dominantStatus: PatternDominantStatus =
    knownSampleSize === 0
      ? "UNKNOWN"
      : input.failCount === input.passCount
        ? "BALANCED"
        : input.failCount > input.passCount
          ? "FAIL"
          : "PASS";
  const counterexampleCount =
    knownSampleSize === 0 ? 0 : Math.min(input.failCount, input.passCount);
  const effectSize =
    knownSampleSize === 0 ? 0 : roundRatio((input.failCount - input.passCount) / knownSampleSize);
  const dataCompleteness = sampleSize === 0 ? 0 : roundRatio(knownSampleSize / sampleSize);

  let confidenceScore = 0;
  if (sampleSize >= PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE) {
    const sampleFactor = Math.min(sampleSize / PATTERN_CONFIDENCE_TARGET_SAMPLE_SIZE, 1);
    const consistencyFactor = knownSampleSize === 0 ? 0 : 1 - counterexampleCount / knownSampleSize;
    confidenceScore = Math.round(
      100 *
        (0.3 * sampleFactor +
          0.3 * Math.abs(effectSize) +
          0.2 * consistencyFactor +
          0.2 * dataCompleteness)
    );
  }
  const level: PatternConfidenceLevel =
    sampleSize < PATTERN_CONFIDENCE_MINIMUM_SAMPLE_SIZE
      ? "INSUFFICIENT"
      : confidenceScore >= 75
        ? "HIGH"
        : confidenceScore >= 50
          ? "MEDIUM"
          : "LOW";

  return {
    confidenceScore,
    counterexampleCount,
    dataCompleteness,
    dominantStatus,
    effectSize,
    failCount: input.failCount,
    knownSampleSize,
    level,
    passCount: input.passCount,
    sampleSize,
    unknownCount: input.unknownCount
  };
}
