# Step 17 acceptance: behavior rule engine

## Scope

Step 17 implements the five deterministic rules named in the execution manual:

- reopen within N minutes after a losing trade
- sudden position-size increase
- moved stop
- daily trade-count limit
- off-plan trade

It does not implement step 18 image upload.

## Evidence and UNKNOWN policy

Every result is `PASS`, `FAIL` or `UNKNOWN` and stores evidence type, optional
evidence trade ID, explanation, confidence, evaluation time and algorithm version.
Rules never infer absent facts:

- Position increase requires at least three prior account positions.
- Moved stop is `UNKNOWN` until stop-change history exists. Once events exist, a
  Long stop moved lower or a Short stop moved higher is a deterministic failure.
- Plan deviation is `UNKNOWN` when no playbook was assigned at trade time.
- `UNKNOWN` has zero confidence and `MISSING_DATA` evidence.

## Deterministic definitions

- Loss reentry compares current open time with the most recent preceding closed
  losing trade in the same account.
- Position increase compares exact decimal quantity with the median of up to 20
  prior account trades and an integer percentage threshold.
- Daily count uses the user's IANA time zone, not UTC date boundaries.
- Plan deviation compares the trade's assigned playbook with the evaluated one.
- Re-evaluation upserts the same five rows and records algorithm
  `behavior-rules-v1`; it never duplicates results.

## API

- `POST /playbooks` creates a user-owned playbook with all five rules.
- `PUT /trades/:tradeId/playbook` assigns or clears a user-owned playbook.
- `POST /trades/:tradeId/rules/evaluate` evaluates and persists results.
- `GET /trades/:tradeId/rule-results` lists evidence-backed results.
- `POST /trades/:tradeId/stop-events` records integer-price stop changes.

All operations require authentication and enforce ownership.

## Database

Migration `20260728000400_step_17_behavior_rules` adds:

- `playbooks`
- `playbook_rules`
- `trade_rule_results`
- `trades.playbook_id`
- `trade_stop_events`
- rule type, result status and evidence type enums
- uniqueness, ownership, confidence and foreign-key constraints

## Verification

Pure-function tests cover pass, fail, insufficient evidence, exact position
thresholds, cooldown, daily limits and plan mismatch. PostgreSQL integration covers
playbook creation, assignment, five persisted results, missing stop evidence and
idempotent re-evaluation.

Run:

```text
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```
