# Step 29 acceptance: automatic review summary

## Scope

This step implements only the structured trade review summary described in Step 29. It does not
implement Step 30 evidence snapshots, invalidation, pattern detection, confidence scoring, or AI
explanation services.

## Delivered behavior

- `PUT /trades/:tradeId/review-summary` generates and persists a versioned summary.
- `GET /trades/:tradeId/review-summary` returns the latest summary or `null`.
- The summary has overview, execution, rule, and user-voice sections.
- Execution conclusions cite execution IDs.
- Rule conclusions cite rule-result IDs.
- Voice conclusions quote only evidence extracted from confirmed voice transcriptions.
- Missing evidence is reported explicitly and never converted into an inferred conclusion.
- Trade and summary access are restricted to the authenticated owner.

## Database

Migration `20260728001700_step_29_review_summary` adds `trade_review_summaries` with:

- one summary per trade;
- structured JSON content;
- generator version and timestamps;
- composite trade/user ownership enforcement.

## Acceptance commands

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```
