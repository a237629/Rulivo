export interface StatisticsTrade {
  closedAt: Date | string;
  id: string;
  pnlMinor: bigint;
}

export interface PerformanceBucket {
  breakeven: number;
  losses: number;
  netPnlMinor: bigint;
  sampleSize: number;
  wins: number;
}

export interface CoreStatistics {
  breakeven: number;
  grossLossMinor: bigint;
  grossProfitMinor: bigint;
  hourly: Record<string, PerformanceBucket>;
  losses: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  maxDrawdownMinor: bigint;
  netPnlMinor: bigint;
  profitFactor: string | null;
  sampleSize: number;
  weekday: Record<string, PerformanceBucket>;
  winRate: string;
  wins: number;
}

const RATIO_SCALE = 1_000_000n;
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const WEEKDAY_MAP: Readonly<Record<string, (typeof WEEKDAYS)[number]>> = {
  Fri: "FRI",
  Mon: "MON",
  Sat: "SAT",
  Sun: "SUN",
  Thu: "THU",
  Tue: "TUE",
  Wed: "WED"
};

function emptyBucket(): PerformanceBucket {
  return { breakeven: 0, losses: 0, netPnlMinor: 0n, sampleSize: 0, wins: 0 };
}

function roundedRatio(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError("Ratio denominator must be positive");
  const scaled = numerator * RATIO_SCALE;
  const quotient = scaled / denominator;
  const remainder = scaled % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

function formatRatio(scaled: bigint): string {
  return `${(scaled / RATIO_SCALE).toString()}.${(scaled % RATIO_SCALE)
    .toString()
    .padStart(6, "0")}`;
}

function updateBucket(bucket: PerformanceBucket, pnlMinor: bigint): void {
  bucket.sampleSize += 1;
  bucket.netPnlMinor += pnlMinor;
  if (pnlMinor > 0n) bucket.wins += 1;
  else if (pnlMinor < 0n) bucket.losses += 1;
  else bucket.breakeven += 1;
}

function zonedParts(date: Date, timeZone: string): { hour: string; weekday: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
    weekday: "short"
  }).formatToParts(date);
  const hour = parts.find(({ type }) => type === "hour")?.value;
  const weekday = parts.find(({ type }) => type === "weekday")?.value;
  if (hour === undefined || weekday === undefined || WEEKDAY_MAP[weekday] === undefined) {
    throw new RangeError("Unable to derive local trade time");
  }
  return { hour: hour === "24" ? "00" : hour, weekday: WEEKDAY_MAP[weekday] };
}

export function calculateCoreStatistics(
  trades: readonly StatisticsTrade[],
  timeZone: string
): CoreStatistics {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
  } catch {
    throw new RangeError("Invalid IANA time zone");
  }
  const sorted = [...trades].sort(
    (left, right) =>
      new Date(left.closedAt).valueOf() - new Date(right.closedAt).valueOf() ||
      left.id.localeCompare(right.id)
  );
  const hourly = Object.fromEntries(
    Array.from({ length: 24 }, (_, hour) => [hour.toString().padStart(2, "0"), emptyBucket()])
  );
  const weekday = Object.fromEntries(WEEKDAYS.map((day) => [day, emptyBucket()]));
  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let grossProfitMinor = 0n;
  let grossLossMinor = 0n;
  let cumulative = 0n;
  let peak = 0n;
  let maxDrawdownMinor = 0n;
  let winStreak = 0;
  let lossStreak = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;

  for (const trade of sorted) {
    const date = new Date(trade.closedAt);
    if (Number.isNaN(date.valueOf())) throw new RangeError("Invalid trade close time");
    if (trade.pnlMinor > 0n) {
      wins += 1;
      winStreak += 1;
      lossStreak = 0;
      grossProfitMinor += trade.pnlMinor;
    } else if (trade.pnlMinor < 0n) {
      losses += 1;
      lossStreak += 1;
      winStreak = 0;
      grossLossMinor += -trade.pnlMinor;
    } else {
      breakeven += 1;
      winStreak = 0;
      lossStreak = 0;
    }
    maxConsecutiveWins = Math.max(maxConsecutiveWins, winStreak);
    maxConsecutiveLosses = Math.max(maxConsecutiveLosses, lossStreak);
    cumulative += trade.pnlMinor;
    peak = cumulative > peak ? cumulative : peak;
    const drawdown = peak - cumulative;
    maxDrawdownMinor = drawdown > maxDrawdownMinor ? drawdown : maxDrawdownMinor;

    const local = zonedParts(date, timeZone);
    updateBucket(hourly[local.hour] ?? emptyBucket(), trade.pnlMinor);
    updateBucket(weekday[local.weekday] ?? emptyBucket(), trade.pnlMinor);
  }

  return {
    breakeven,
    grossLossMinor,
    grossProfitMinor,
    hourly,
    losses,
    maxConsecutiveLosses,
    maxConsecutiveWins,
    maxDrawdownMinor,
    netPnlMinor: grossProfitMinor - grossLossMinor,
    profitFactor:
      grossLossMinor === 0n ? null : formatRatio(roundedRatio(grossProfitMinor, grossLossMinor)),
    sampleSize: sorted.length,
    weekday,
    winRate:
      sorted.length === 0
        ? "0.000000"
        : formatRatio(roundedRatio(BigInt(wins), BigInt(sorted.length))),
    wins
  };
}
