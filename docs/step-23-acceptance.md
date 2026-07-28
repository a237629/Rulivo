# Step 23 acceptance — filtered trade list

Scope is limited to trade-summary listing and filters. Trade details belong to Step 24, result-score calculation to Step 25, and execution-score calculation to Step 26; all are intentionally absent.

## Delivered

- Authenticated, tenant-scoped `GET /trades`.
- Filters for UTC opened date, account, market, strategy/playbook, realized result, and execution-score range.
- Result categories are deterministically derived from integer realized P&L: `WIN`, `LOSS`, `BREAKEVEN`, or `UNKNOWN`.
- Stable newest-first cursor pagination with a bounded page size of 1–100.
- Cursor ownership validation prevents another user's ID from influencing pagination.
- Summary response contains account and strategy names but excludes executions, images, notes, voice, and rule details.
- Nullable `execution_score` storage and range filtering. No scoring algorithm is introduced before Step 26; unscored trades remain `null`.
- Mobile filter surface plus typed list client. The current demo session still requires real-token integration before private rows can load.

## Filters

```text
dateFrom=YYYY-MM-DD
dateTo=YYYY-MM-DD
accountId=<uuid>
market=<market>
strategyId=<playbook uuid>
result=WIN|LOSS|BREAKEVEN|UNKNOWN
executionScoreMin=0..100
executionScoreMax=0..100
cursor=<trade uuid>
limit=1..100
```

Date bounds use UTC calendar days and are inclusive.

## Acceptance

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm --filter @rulivo/mobile test
pnpm check
```
