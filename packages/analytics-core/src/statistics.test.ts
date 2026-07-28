import { describe, expect, it } from "vitest";
import { calculateCoreStatistics } from "./statistics.js";

const goldenTrades = [
  { closedAt: "2026-01-05T01:00:00Z", id: "1", pnlMinor: 100n },
  { closedAt: "2026-01-05T02:00:00Z", id: "2", pnlMinor: 200n },
  { closedAt: "2026-01-06T03:00:00Z", id: "3", pnlMinor: -150n },
  { closedAt: "2026-01-06T04:00:00Z", id: "4", pnlMinor: -100n },
  { closedAt: "2026-01-07T05:00:00Z", id: "5", pnlMinor: 50n },
  { closedAt: "2026-01-07T06:00:00Z", id: "6", pnlMinor: 0n }
] as const;

describe("core statistics golden cases", () => {
  it("calculates win rate, profit factor, drawdown and streaks", () => {
    const result = calculateCoreStatistics(goldenTrades, "UTC");
    expect(result).toMatchObject({
      breakeven: 1,
      grossLossMinor: 250n,
      grossProfitMinor: 350n,
      losses: 2,
      maxConsecutiveLosses: 2,
      maxConsecutiveWins: 2,
      maxDrawdownMinor: 250n,
      netPnlMinor: 100n,
      profitFactor: "1.400000",
      sampleSize: 6,
      winRate: "0.500000",
      wins: 3
    });
  });

  it("groups hourly and weekday performance in the requested IANA time zone", () => {
    const result = calculateCoreStatistics(goldenTrades, "Asia/Shanghai");
    expect(result.hourly["09"]).toMatchObject({ netPnlMinor: 100n, sampleSize: 1, wins: 1 });
    expect(result.weekday.MON).toMatchObject({
      netPnlMinor: 300n,
      sampleSize: 2,
      wins: 2
    });
  });

  it("normalizes local midnight to the 00 bucket", () => {
    const result = calculateCoreStatistics(
      [{ closedAt: "2026-01-01T16:00:00Z", id: "midnight", pnlMinor: 1n }],
      "Asia/Shanghai"
    );
    expect(result.hourly["00"]?.sampleSize).toBe(1);
  });

  it("returns a null profit factor when there are no losses", () => {
    const result = calculateCoreStatistics([goldenTrades[0]], "UTC");
    expect(result.profitFactor).toBeNull();
    expect(result.winRate).toBe("1.000000");
    expect(result.maxDrawdownMinor).toBe(0n);
  });

  it("uses close time then ID as a stable drawdown order", () => {
    const sameTime = "2026-01-01T00:00:00Z";
    const result = calculateCoreStatistics(
      [
        { closedAt: sameTime, id: "b", pnlMinor: 100n },
        { closedAt: sameTime, id: "a", pnlMinor: -50n }
      ],
      "UTC"
    );
    expect(result.maxDrawdownMinor).toBe(50n);
  });

  it("rejects invalid dates and time zones", () => {
    expect(() => calculateCoreStatistics([], "Mars/Olympus")).toThrow("time zone");
    expect(() =>
      calculateCoreStatistics([{ closedAt: "invalid", id: "1", pnlMinor: 0n }], "UTC")
    ).toThrow("close time");
  });
});
