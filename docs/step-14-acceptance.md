# Step 14 acceptance: deterministic trade grouping

## Scope

Step 14 converts valid normalized executions from a confirmed CSV batch into
trades. It handles partial fills, position reductions, reversals and positions that
remain open across UTC dates. It does not implement step 15 analytics, risk or R
multiple calculations.

## Deterministic boundaries

- Rows are ordered by execution timestamp and then original CSV row number.
- Positions are tracked independently by market, symbol and currency.
- Same-direction executions increase the active position.
- Opposite executions reduce it; reaching zero closes the trade.
- An execution larger than the active position is split exactly at zero: one part
  closes the old trade and the remainder opens the opposite trade.
- Crossing midnight does not close a position.
- Reversal fees are allocated by exact quantity ratio; the integer remainder is
  assigned to the new opening execution, so no fee is lost.

## API and idempotency

`POST /imports/csv/:batchId/group` requires an authenticated owner and a confirmed
batch. Grouping runs in a database transaction with a row lock. Repeating the call
returns `alreadyGrouped: true` and never duplicates trades or executions.

## Traceability

- `trades.import_batch_id` links every generated trade to its CSV batch.
- `csv_import_execution_sources` links each generated execution to its original
  CSV row and records allocated quantity and fee.
- `csv_import_batches.grouped_at` records completion.
- Imported trades use source `CSV`; fees use type `COMMISSION`.

## Verification

- Unit tests cover partial fills, reductions, reversals, fee allocation,
  cross-day positions, independent instruments and stable ordering.
- PostgreSQL integration tests verify generated trades, executions, fees, source
  links and idempotent retries.
- The migration contract confirms the change is non-destructive.
- Run `pnpm --filter @rulivo/api db:migrate:deploy`, then `pnpm check`.
