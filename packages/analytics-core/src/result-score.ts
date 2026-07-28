export interface ResultScore {
  outcomeComponent: number;
  resultScore: number;
  riskAdjustedComponent: number;
  targetAchievementComponent: number;
}

const SCALE = 1_000_000n;

function parseFixedSix(value: string, label: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(value);
  if (match === null) throw new RangeError(`${label} must have at most 6 decimal places`);
  const magnitude = BigInt(match[2] ?? "0") * SCALE + BigInt((match[3] ?? "").padEnd(6, "0"));
  return match[1] === "-" ? -magnitude : magnitude;
}

function roundedRatio(numerator: bigint, denominator: bigint): number {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return Number(quotient + (remainder * 2n >= denominator ? 1n : 0n));
}

export function calculateResultScore(
  rMultiple: string,
  plannedTargetRMultiple: string,
  realizedPnlMinor: bigint
): ResultScore {
  const riskAdjusted = parseFixedSix(rMultiple, "R multiple");
  const target = parseFixedSix(plannedTargetRMultiple, "Planned target R multiple");
  if (target <= 0n) throw new RangeError("Planned target R multiple must be greater than zero");

  const boundedRisk = riskAdjusted < -SCALE ? -SCALE : riskAdjusted > SCALE ? SCALE : riskAdjusted;
  const riskAdjustedComponent = roundedRatio((boundedRisk + SCALE) * 50n, 2n * SCALE);
  const positiveRisk = riskAdjusted < 0n ? 0n : riskAdjusted;
  const boundedAchievement = positiveRisk > target ? target : positiveRisk;
  const targetAchievementComponent = roundedRatio(boundedAchievement * 30n, target);
  const outcomeComponent = realizedPnlMinor > 0n ? 20 : realizedPnlMinor === 0n ? 10 : 0;

  return {
    outcomeComponent,
    resultScore: riskAdjustedComponent + targetAchievementComponent + outcomeComponent,
    riskAdjustedComponent,
    targetAchievementComponent
  };
}

export const RESULT_SCORE_VERSION = "result-v1";
