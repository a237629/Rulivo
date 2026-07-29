import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runPatternDetection } from "./pattern-detection.js";
import { PostgresPatternDetectionStore } from "./postgres-pattern-store.js";

const connectionString = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";

describe("PostgreSQL pattern detection", () => {
  const pool = new Pool({ connectionString });
  const store = new PostgresPatternDetectionStore(connectionString);
  const userId = randomUUID();
  const accountId = randomUUID();
  const instrumentId = randomUUID();
  const playbookId = randomUUID();
  const tradeId = randomUUID();
  const suffix = userId.slice(0, 8);
  const runIds: string[] = [];

  beforeAll(async () => {
    await pool.query(
      `INSERT INTO users (id, email, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [userId, `worker-${suffix}@example.com`]
    );
    await pool.query(
      `INSERT INTO trading_accounts (id, user_id, name, updated_at)
       VALUES ($1, $2, 'Worker Test', CURRENT_TIMESTAMP)`,
      [accountId, userId]
    );
    await pool.query(
      `INSERT INTO instruments (id, symbol, market, currency, updated_at)
       VALUES ($1, $2, 'WORKER_TEST', 'USD', CURRENT_TIMESTAMP)`,
      [instrumentId, `WK${suffix}`]
    );
    await pool.query(
      `INSERT INTO playbooks (id, user_id, name, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [playbookId, userId, `Worker ${suffix}`]
    );
    const rules = [
      ["LOSS_REENTRY", { minutes: 30 }],
      ["POSITION_INCREASE", { baselineTrades: 20, increasePercent: 50 }],
      ["MOVED_STOP", { requiresStopHistory: true }],
      ["DAILY_TRADE_LIMIT", { maxTrades: 5 }],
      ["PLAN_DEVIATION", { requiresAssignedPlaybook: true }]
    ] as const;
    for (const [type, config] of rules) {
      await pool.query(
        `INSERT INTO playbook_rules (id, playbook_id, type, config, updated_at)
         VALUES ($1, $2, $3, $4::jsonb, CURRENT_TIMESTAMP)`,
        [randomUUID(), playbookId, type, JSON.stringify(config)]
      );
    }
    await pool.query(
      `INSERT INTO trades (
         id, user_id, trading_account_id, instrument_id, playbook_id, symbol, market,
         side, opened_at, quantity, entry_price_minor, currency, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, 'WORKER_TEST',
         'LONG', CURRENT_TIMESTAMP - INTERVAL '1 hour', 1, 100, 'USD', CURRENT_TIMESTAMP
       )`,
      [tradeId, userId, accountId, instrumentId, playbookId, `WK${suffix}`]
    );
  });

  afterAll(async () => {
    if (runIds.length > 0) {
      await pool.query(`DELETE FROM pattern_detection_runs WHERE id = ANY($1::uuid[])`, [runIds]);
    }
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.query(`DELETE FROM instruments WHERE id = $1`, [instrumentId]);
    await store.close();
    await pool.end();
  });

  it("runs daily incrementally and weekly in full with versioned snapshots", async () => {
    await store.evaluateTrade(tradeId, "behavior-rules-v1");
    const daily = await runPatternDetection(store, "DAILY_INCREMENTAL");
    runIds.push(daily.runId);
    expect(daily).toMatchObject({ failedTrades: 0, processedTrades: 1, status: "SUCCEEDED" });
    const snapshots = await pool.query<{ algorithm_version: string }>(
      `SELECT algorithm_version FROM behavior_evidence_snapshots
       WHERE trade_id = $1 AND invalidated_at IS NULL`,
      [tradeId]
    );
    expect(snapshots.rows).toHaveLength(5);
    expect(new Set(snapshots.rows.map(({ algorithm_version }) => algorithm_version))).toEqual(
      new Set(["behavior-rules-v1"])
    );
    const confidences = await pool.query<{
      algorithm_version: string;
      confidence_score: number;
      level: string;
      sample_size: number;
    }>(
      `SELECT algorithm_version, confidence_score, level, sample_size
       FROM behavior_pattern_confidences
       WHERE user_id = $1 ORDER BY pattern_type`,
      [userId]
    );
    expect(confidences.rows).toHaveLength(5);
    expect(confidences.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          algorithm_version: "pattern-confidence-v1",
          confidence_score: 0,
          level: "INSUFFICIENT",
          sample_size: 1
        })
      ])
    );

    const weekly = await runPatternDetection(store, "WEEKLY_FULL");
    runIds.push(weekly.runId);
    expect(weekly).toMatchObject({ failedTrades: 0, processedTrades: 1, status: "SUCCEEDED" });
    const runs = await pool.query<{ algorithm_version: string; mode: string; status: string }>(
      `SELECT mode, status, algorithm_version FROM pattern_detection_runs
       WHERE id = ANY($1::uuid[]) ORDER BY started_at`,
      [[daily.runId, weekly.runId]]
    );
    expect(runs.rows).toEqual([
      {
        algorithm_version: "behavior-rules-v1",
        mode: "DAILY_INCREMENTAL",
        status: "SUCCEEDED"
      },
      {
        algorithm_version: "behavior-rules-v1",
        mode: "WEEKLY_FULL",
        status: "SUCCEEDED"
      }
    ]);
  });
});
