# Step 16 acceptance: core statistics

## Scope

Step 16 adds deterministic statistics for closed trades with calculated realized
P&L:

- win rate
- Profit Factor
- maximum absolute drawdown
- maximum consecutive wins and losses
- local-hour performance
- local-weekday performance

It does not implement step 17 behavioral rules or infer user behavior.

## Definitions

- `win rate = winning trades / all sampled trades`; breakeven trades remain in the
  denominator.
- `Profit Factor = gross winning P&L / absolute gross losing P&L`.
- Profit Factor is `null` when there are no losing trades; the API does not emit an
  invented infinity value.
- Maximum drawdown is the largest peak-to-trough decline in cumulative realized
  P&L, measured in integer minor currency units with an initial peak of zero.
- A breakeven trade resets both winning and losing streaks.
- Trade order is close time, then stable trade ID.
- Hour and weekday buckets use the requested IANA time zone.

Ratios are six-decimal strings and use integer arithmetic. Money remains `bigint`
inside analytics-core and is serialized as a string at the API boundary.

## API

`GET /analytics/core` accepts optional query parameters:

- `from`: inclusive ISO timestamp
- `to`: exclusive ISO timestamp
- `timeZone`: IANA zone; defaults to the user profile and then UTC
- `tradingAccountId`: limits the user-owned trade query

Only `CLOSED` trades with `realized_pnl_minor` are included. Results are partitioned
by currency so unrelated monetary units are never added together. Empty data
returns an empty currency list and sample size zero.

## Database

No migration is required. Step 16 derives statistics from the step 15 trade fields
at read time, preventing stale aggregate snapshots.

## Verification

Golden tests cover win rate, Profit Factor, drawdown, streaks, breakeven behavior,
stable ordering, time-zone conversion, missing-loss semantics and invalid input.
The PostgreSQL integration test verifies authentication, account filtering,
currency grouping, string serialization and local-hour output.

Run `pnpm check` for full acceptance.
