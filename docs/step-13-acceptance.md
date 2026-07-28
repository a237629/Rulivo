# Step 13 acceptance: initial CSV presets

## Scope

Step 13 adds built-in presets for Binance, OKX, Bybit, Interactive Brokers and a
canonical generic CSV. It deliberately does not group normalized executions into
trades; deterministic grouping belongs to step 14.

## API

- `GET /imports/csv/presets` lists the five immutable built-in definitions.
- `POST /imports/csv/:batchId/detect-preset` detects a compatible preset from headers.
- `PUT /imports/csv/:batchId/preset` with `{ "presetId": "BINANCE" }` applies a preset.

Detection is case-insensitive and ignores common header punctuation. A preset is
never guessed unless all required fields (`executedAt`, `symbol`, `action`,
`quantity`, `price`) are present. Optional fee, currency, market and external ID
fields are used when available.

## Normalization and traceability

- Binance, OKX and Bybit default to the `CRYPTO` market and eight price decimals.
- Interactive Brokers accepts `BUY`/`SELL` and `BOT`/`SLD`, defaults to the US
  market and four price decimals.
- Generic CSV uses stable canonical headers and the existing manual mapping remains
  available as a fallback.
- The selected preset ID is stored on `csv_import_batches`; the database constraint
  only permits the five supported values.
- Money continues to be normalized to integer minor units and timestamps to UTC.

## Verification

- Unit tests cover all five definitions, alias resolution, detection, missing fields
  and Interactive Brokers action aliases.
- OpenAPI contract tests cover every new route.
- The schema contract verifies the non-destructive migration and preset allowlist.
- Apply the migration with `pnpm --filter @rulivo/api db:migrate:deploy`.
- Run the complete repository checks with `pnpm check`.
