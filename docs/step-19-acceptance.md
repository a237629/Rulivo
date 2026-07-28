# Step 19 acceptance — screenshot parsing

Scope is limited to extracting candidate screenshot fields and explicit user confirmation. Voice capture and all later steps are intentionally absent.

## Delivered

- Authenticated, owner-scoped parsing for private Step 18 images.
- Region-configurable multimodal provider adapter with a 30-second timeout and fail-closed behavior.
- Strict candidate JSON for asset, LONG/SHORT direction, decimal price, timeframe, and visible annotations.
- Immutable candidate record retaining the exact model identifier and prompt version.
- Separate confirmation endpoint requiring every candidate field, including explicit `null` and an annotations array.
- Database constraint preventing a record from being marked confirmed without both confirmed data and timestamp.
- Mobile API helpers for parse and confirm; they require a real access token and never silently accept model output.

## API

- `POST /images/:imageId/parse`
- `GET /screenshot-parses/:parseId`
- `POST /screenshot-parses/:parseId/confirm`

The model output remains a candidate until the user submits the confirmation endpoint. Confirmation may correct any candidate value.

## Configuration

```env
SCREENSHOT_MODEL_ENDPOINT=
SCREENSHOT_MODEL_API_KEY=
SCREENSHOT_MODEL_NAME=
```

Configure these independently in Global and China regions after privacy and cross-border review. The endpoint must accept the documented JSON request and return the strict candidate JSON object. Without configuration, parsing returns `503` and no candidate row is created.

## Acceptance

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm check
```
