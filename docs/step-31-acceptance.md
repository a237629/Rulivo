# Step 31 acceptance: pattern detection jobs

## Scope

This step implements explicit daily incremental and weekly full pattern-detection tasks. It records
the algorithm version for every run and every regenerated evidence snapshot. It does not implement
Step 32 confidence thresholds, effect sizes, counterexamples, or completeness scoring.

## Delivered behavior

- `pnpm --filter @rulivo/analytics-worker run:daily` runs daily incremental detection.
- `pnpm --filter @rulivo/analytics-worker run:weekly` runs weekly full recalculation.
- Daily selection includes trades updated after the last successful daily cutoff and trades without
  a current valid evidence snapshot.
- Weekly selection includes every trade assigned to an active playbook.
- Each selected trade is recalculated from PostgreSQL source trades, playbook rules, stop history,
  account history, and user timezone.
- Rule results and the five evidence snapshots are updated atomically per trade.
- Each job persists mode, status, cutoff, start/end times, processed/failed counts, error text, and
  `behavior-rules-v1`.
- A failed trade does not stop the remainder of the batch; the final run is marked failed and
  reports the failure count.

## Database

Migration `20260729000100_step_31_pattern_detection_jobs` adds:

- `PatternDetectionMode` with `DAILY_INCREMENTAL` and `WEEKLY_FULL`;
- `PatternDetectionRunStatus`;
- `pattern_detection_runs` with completion and non-negative count constraints;
- an index supporting last-successful-cutoff lookup.

## Scheduling

Production schedulers should invoke:

```powershell
pnpm --filter @rulivo/analytics-worker run:daily
pnpm --filter @rulivo/analytics-worker run:weekly
```

The commands are deliberately separate so deployment infrastructure can schedule the daily command
once per day and the weekly command once per week without an in-process timer.

## Acceptance commands

```powershell
pnpm install --frozen-lockfile
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```
