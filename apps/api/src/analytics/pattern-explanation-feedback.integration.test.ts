import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const connectionString = "postgresql://rulivo:rulivo@localhost:5432/rulivo?schema=public";

describe("PostgreSQL pattern explanation feedback", () => {
  const pool = new Pool({ connectionString });
  const userId = randomUUID();
  const explanationId = randomUUID();
  const output = {
    explanations: [
      {
        conclusion: "Evidence-based explanation.",
        limitations: [],
        numeric_claims: [],
        pattern_type: "LOSS_REENTRY"
      }
    ]
  };

  beforeAll(async () => {
    await pool.query(
      `INSERT INTO users (id, email, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [userId, `feedback-${userId.slice(0, 8)}@example.com`]
    );
    await pool.query(
      `INSERT INTO behavior_pattern_explanations (
         id, user_id, input_metric_ids, input_fingerprint, output, model_version, prompt_version
       ) VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, 'test-model', 'test-prompt')`,
      [
        explanationId,
        userId,
        JSON.stringify([randomUUID()]),
        "a".repeat(64),
        JSON.stringify(output)
      ]
    );
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM pattern_explanation_feedback WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });

  it("appends feedback without mutating the explanation and rejects a duplicate reason", async () => {
    const values = [
      explanationId,
      userId,
      "LOSS_REENTRY",
      "EVIDENCE_ERROR",
      JSON.stringify(output.explanations[0]),
      "a".repeat(64)
    ];
    await pool.query(
      `INSERT INTO pattern_explanation_feedback (
         explanation_id, user_id, pattern_type, reason, explanation_output_snapshot,
         explanation_input_fingerprint, model_version, prompt_version
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'test-model', 'test-prompt')`,
      values
    );
    const stored = await pool.query<{ output: unknown }>(
      `SELECT output FROM behavior_pattern_explanations WHERE id = $1`,
      [explanationId]
    );
    expect(stored.rows[0]?.output).toEqual(output);
    await expect(
      pool.query(
        `INSERT INTO pattern_explanation_feedback (
           explanation_id, user_id, pattern_type, reason, explanation_output_snapshot,
           explanation_input_fingerprint, model_version, prompt_version
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'test-model', 'test-prompt')`,
        values
      )
    ).rejects.toMatchObject({ code: "23505" });
  });
});
