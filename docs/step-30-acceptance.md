# Step 30 acceptance: evidence dataset

## Scope

This step implements reproducible evidence snapshots for each behavior pattern and invalidates old
snapshots after source trade changes. It does not implement Step 31 daily or weekly pattern-detection
jobs.

## Delivered behavior

- Every behavior-rule evaluation stores one snapshot for each of the five behavior patterns.
- Each snapshot contains the complete normalized rule context, stored output, algorithm version,
  source-trade update time, and computation time.
- `GET /trades/:tradeId/evidence-snapshots` returns current and historical snapshots for the owner.
- `POST /evidence-snapshots/:snapshotId/recompute` recalculates a stored snapshot and reports whether
  the result matches the persisted output.
- Re-evaluation marks prior current snapshots as `RECOMPUTED`.
- Adding stop evidence marks current snapshots as `STOP_EVENT_ADDED`.
- A PostgreSQL trigger marks current snapshots as `TRADE_MODIFIED` when source trade fields change.
- Derived score and quadrant updates do not invalidate source evidence.
- A partial unique index permits only one current snapshot per trade and behavior pattern.

## Database

Migration `20260728001800_step_30_evidence_snapshots` adds:

- `behavior_evidence_snapshots`;
- tenant-safe trade ownership constraints;
- input/output JSON and provenance columns;
- validity consistency and current-snapshot uniqueness constraints;
- the trade-source change invalidation trigger.

## Acceptance commands

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```
