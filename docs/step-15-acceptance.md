# Step 15 acceptance: deterministic P&L and R multiple

## Scope

Step 15 creates `@rulivo/analytics-core` and implements P&L and R multiple as pure,
deterministic functions. It does not implement step 16 portfolio statistics such
as win rate, Profit Factor, drawdown, streaks or time/weekday performance.

## Numeric rules

- Prices, fees, risk and P&L use `bigint` integer minor currency units.
- Quantities are parsed as decimal strings with at most ten decimal places.
- No JavaScript floating-point number participates in money calculation.
- Partial exits use exact rational average-cost allocation.
- Final minor-unit results use round-half-away-from-zero.
- R multiple is `net realized P&L / initial risk`, returned and stored to six decimal
  places with the same deterministic rounding rule.
- Initial risk must be a positive integer minor-unit amount.

`realized_pnl_minor` is defined as realized gross P&L minus all execution fees
currently attached to the trade. An open trade may therefore have negative net
realized P&L before any quantity is closed because paid opening fees are included.

## API and persistence

`PUT /trades/:tradeId/analytics` recalculates a user-owned trade from persisted
executions and fees. Request body:

```json
{ "initialRiskMinor": "10000" }
```

Passing `null` clears initial risk and R while still recalculating P&L. Omitting the
field reuses stored risk. The result writes:

- `trades.realized_pnl_minor`
- `trades.initial_risk_minor`
- `trades.r_multiple`
- `trades.analytics_calculated_at`

## Golden verification

Golden cases cover weighted partial long exits, multi-fill short positions,
fractional quantities, fees, positive/negative R and six-decimal rounding.
PostgreSQL integration verifies API serialization and persisted integer values.

Run:

```text
pnpm --filter @rulivo/api db:migrate:deploy
pnpm check
```
