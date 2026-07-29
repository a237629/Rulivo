import {
  calculatePatternConfidence,
  evaluateBehaviorRules,
  PATTERN_CONFIDENCE_VERSION,
  type BehaviorRuleType
} from "@rulivo/analytics-core";
import { Pool, type PoolClient } from "pg";
import type { PatternDetectionMode, PatternDetectionStore } from "./pattern-detection.js";

interface TradeRow {
  id: string;
  user_id: string;
  trading_account_id: string;
  playbook_id: string;
  opened_at: Date;
  quantity: string;
  side: "LONG" | "SHORT";
  updated_at: Date;
  time_zone: string | null;
}

interface RuleRow {
  config: Record<string, unknown>;
  id: string;
  type: BehaviorRuleType;
}

interface ConfidenceAggregateRow {
  fail_count: string;
  pass_count: string;
  pattern_type: BehaviorRuleType;
  unknown_count: string;
  user_id: string;
}

function configInteger(rule: RuleRow | undefined, key: string): number {
  const value = rule?.config[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Invalid ${String(rule?.type)} rule configuration`);
  }
  return value;
}

function dateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).format(date);
}

export class PostgresPatternDetectionStore implements PatternDetectionStore {
  private readonly pool: Pool;

  public constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async createRun(input: {
    algorithmVersion: string;
    cutoffAt: Date;
    mode: PatternDetectionMode;
  }): Promise<string> {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO pattern_detection_runs (mode, algorithm_version, cutoff_at)
       VALUES ($1, $2, $3) RETURNING id`,
      [input.mode, input.algorithmVersion, input.cutoffAt]
    );
    const id = result.rows[0]?.id;
    if (id === undefined) throw new Error("Pattern detection run was not created");
    return id;
  }

  public async completeRun(input: {
    errorMessage: string | null;
    failedTrades: number;
    processedTrades: number;
    runId: string;
    status: "FAILED" | "SUCCEEDED";
  }): Promise<void> {
    await this.pool.query(
      `UPDATE pattern_detection_runs
       SET status = $1, finished_at = CURRENT_TIMESTAMP, processed_trades = $2,
           failed_trades = $3, error_message = $4
       WHERE id = $5`,
      [input.status, input.processedTrades, input.failedTrades, input.errorMessage, input.runId]
    );
  }

  public async selectTradeIds(mode: PatternDetectionMode, cutoffAt: Date): Promise<string[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT t.id
       FROM trades t
       JOIN playbooks p ON p.id = t.playbook_id AND p.is_active = true
       WHERE t.updated_at <= $1
         AND (
           $2::"PatternDetectionMode" = 'WEEKLY_FULL'
           OR t.updated_at > COALESCE(
             (
               SELECT MAX(cutoff_at)
               FROM pattern_detection_runs
               WHERE mode = 'DAILY_INCREMENTAL' AND status = 'SUCCEEDED' AND cutoff_at < $1
             ),
             '-infinity'::timestamptz
           )
           OR NOT EXISTS (
             SELECT 1 FROM behavior_evidence_snapshots s
             WHERE s.trade_id = t.id AND s.invalidated_at IS NULL
           )
         )
       ORDER BY t.updated_at ASC, t.id ASC`,
      [cutoffAt, mode]
    );
    return result.rows.map(({ id }) => id);
  }

  public async evaluateTrade(tradeId: string, algorithmVersion: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const tradeResult = await client.query<TradeRow>(
        `SELECT t.id, t.user_id, t.trading_account_id, t.playbook_id, t.opened_at,
                t.quantity::text, t.side, t.updated_at, up.time_zone
         FROM trades t
         JOIN playbooks p ON p.id = t.playbook_id AND p.is_active = true
         LEFT JOIN user_profiles up ON up.user_id = t.user_id
         WHERE t.id = $1
         FOR UPDATE OF t`,
        [tradeId]
      );
      const trade = tradeResult.rows[0];
      if (trade === undefined) throw new Error("Trade or active playbook was not found");
      const rulesResult = await client.query<RuleRow>(
        `SELECT id, type, config
         FROM playbook_rules
         WHERE playbook_id = $1 AND enabled = true`,
        [trade.playbook_id]
      );
      const rules = new Map(rulesResult.rows.map((rule) => [rule.type, rule]));
      const requiredTypes: BehaviorRuleType[] = [
        "LOSS_REENTRY",
        "POSITION_INCREASE",
        "MOVED_STOP",
        "DAILY_TRADE_LIMIT",
        "PLAN_DEVIATION"
      ];
      if (requiredTypes.some((type) => !rules.has(type))) {
        throw new Error("Playbook does not contain every required behavior rule");
      }

      const context = await this.buildContext(client, trade, rules);
      const results = evaluateBehaviorRules(context);
      for (const result of results) {
        const rule = rules.get(result.type);
        if (rule === undefined) throw new Error("Playbook rule is missing");
        await client.query(
          `INSERT INTO trade_rule_results (
             id, trade_id, playbook_rule_id, status, evidence_type, evidence_id,
             explanation, confidence, algorithm_version
           ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (trade_id, playbook_rule_id) DO UPDATE SET
             status = EXCLUDED.status,
             evidence_type = EXCLUDED.evidence_type,
             evidence_id = EXCLUDED.evidence_id,
             explanation = EXCLUDED.explanation,
             confidence = EXCLUDED.confidence,
             algorithm_version = EXCLUDED.algorithm_version,
             evaluated_at = CURRENT_TIMESTAMP`,
          [
            trade.id,
            rule.id,
            result.status,
            result.evidenceType,
            result.evidenceId,
            result.explanation,
            result.confidence,
            algorithmVersion
          ]
        );
      }
      await client.query(
        `UPDATE behavior_evidence_snapshots
         SET invalidated_at = CURRENT_TIMESTAMP, invalidation_reason = 'RECOMPUTED'
         WHERE trade_id = $1 AND invalidated_at IS NULL`,
        [trade.id]
      );
      const storedContext = {
        ...context,
        movedStopEvidenceId: context.movedStopEvidenceId ?? null,
        openedAt: new Date(context.openedAt).toISOString(),
        previousLoss:
          context.previousLoss === null
            ? null
            : {
                closedAt: new Date(context.previousLoss.closedAt).toISOString(),
                id: context.previousLoss.id
              }
      };
      for (const result of results) {
        await client.query(
          `INSERT INTO behavior_evidence_snapshots (
             trade_id, user_id, pattern_type, input_data, output_data,
             algorithm_version, source_trade_updated_at
           ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)`,
          [
            trade.id,
            trade.user_id,
            result.type,
            JSON.stringify(storedContext),
            JSON.stringify(result),
            algorithmVersion,
            trade.updated_at
          ]
        );
      }
      await client.query(
        `UPDATE trades SET
           execution_score = NULL,
           execution_score_version = NULL,
           execution_score_calculated_at = NULL,
           quadrant_evaluation = NULL,
           quadrant_version = NULL,
           quadrant_calculated_at = NULL
         WHERE id = $1`,
        [trade.id]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public async recalculateConfidence(runId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const aggregates = await client.query<ConfidenceAggregateRow>(
        `SELECT
           user_id,
           pattern_type,
           COUNT(*) FILTER (WHERE output_data->>'status' = 'PASS')::text AS pass_count,
           COUNT(*) FILTER (WHERE output_data->>'status' = 'FAIL')::text AS fail_count,
           COUNT(*) FILTER (
             WHERE output_data->>'status' IS NULL OR output_data->>'status' NOT IN ('PASS', 'FAIL')
           )::text AS unknown_count
         FROM behavior_evidence_snapshots
         WHERE invalidated_at IS NULL
         GROUP BY user_id, pattern_type
         ORDER BY user_id, pattern_type`
      );
      await client.query(`DELETE FROM behavior_pattern_confidences`);
      for (const row of aggregates.rows) {
        const confidence = calculatePatternConfidence({
          failCount: Number(row.fail_count),
          passCount: Number(row.pass_count),
          unknownCount: Number(row.unknown_count)
        });
        await client.query(
          `INSERT INTO behavior_pattern_confidences (
             user_id, pattern_type, sample_size, known_sample_size, pass_count, fail_count,
             unknown_count, counterexample_count, dominant_status, effect_size,
             data_completeness, confidence_score, level, algorithm_version, source_run_id
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
           )`,
          [
            row.user_id,
            row.pattern_type,
            confidence.sampleSize,
            confidence.knownSampleSize,
            confidence.passCount,
            confidence.failCount,
            confidence.unknownCount,
            confidence.counterexampleCount,
            confidence.dominantStatus,
            confidence.effectSize,
            confidence.dataCompleteness,
            confidence.confidenceScore,
            confidence.level,
            PATTERN_CONFIDENCE_VERSION,
            runId
          ]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async buildContext(
    client: PoolClient,
    trade: TradeRow,
    rules: Map<BehaviorRuleType, RuleRow>
  ) {
    const previousLoss = await client.query<{ closed_at: Date; id: string }>(
      `SELECT id, closed_at FROM trades
         WHERE user_id = $1 AND trading_account_id = $2 AND id <> $3
           AND status = 'CLOSED' AND realized_pnl_minor < 0 AND closed_at <= $4
         ORDER BY closed_at DESC, id DESC LIMIT 1`,
      [trade.user_id, trade.trading_account_id, trade.id, trade.opened_at]
    );
    const priorTrades = await client.query<{ quantity: string }>(
      `SELECT quantity::text FROM trades
         WHERE user_id = $1 AND trading_account_id = $2 AND id <> $3 AND opened_at < $4
         ORDER BY opened_at DESC, id DESC LIMIT 20`,
      [trade.user_id, trade.trading_account_id, trade.id, trade.opened_at]
    );
    const nearbyTrades = await client.query<{ id: string; opened_at: Date }>(
      `SELECT id, opened_at FROM trades
         WHERE user_id = $1 AND trading_account_id = $2
           AND opened_at >= $3 AND opened_at < $4`,
      [
        trade.user_id,
        trade.trading_account_id,
        new Date(trade.opened_at.valueOf() - 86_400_000),
        new Date(trade.opened_at.valueOf() + 86_400_000)
      ]
    );
    const stopEvents = await client.query<{
      id: string;
      new_stop_price_minor: string;
      previous_stop_price_minor: string;
    }>(
      `SELECT id, new_stop_price_minor::text, previous_stop_price_minor::text
         FROM trade_stop_events WHERE trade_id = $1 ORDER BY occurred_at ASC, id ASC`,
      [trade.id]
    );
    const timeZone = trade.time_zone ?? "UTC";
    const localDay = dateKey(trade.opened_at, timeZone);
    return {
      currentPlaybookId: trade.playbook_id,
      dailyTradeIds: nearbyTrades.rows
        .filter((candidate) => dateKey(candidate.opened_at, timeZone) === localDay)
        .map(({ id }) => id),
      evaluatedPlaybookId: trade.playbook_id,
      lossReentryMinutes: configInteger(rules.get("LOSS_REENTRY"), "minutes"),
      maxDailyTrades: configInteger(rules.get("DAILY_TRADE_LIMIT"), "maxTrades"),
      movedStop:
        stopEvents.rows.length === 0
          ? null
          : stopEvents.rows.some((event) =>
              trade.side === "LONG"
                ? BigInt(event.new_stop_price_minor) < BigInt(event.previous_stop_price_minor)
                : BigInt(event.new_stop_price_minor) > BigInt(event.previous_stop_price_minor)
            ),
      movedStopEvidenceId: stopEvents.rows.at(-1)?.id,
      openedAt: trade.opened_at,
      positionIncreasePercent: configInteger(rules.get("POSITION_INCREASE"), "increasePercent"),
      previousLoss:
        previousLoss.rows[0] === undefined
          ? null
          : { closedAt: previousLoss.rows[0].closed_at, id: previousLoss.rows[0].id },
      priorQuantities: priorTrades.rows.map(({ quantity }) => quantity),
      quantity: trade.quantity,
      tradeId: trade.id
    };
  }
}
