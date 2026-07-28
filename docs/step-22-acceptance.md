# Step 22 acceptance — behavioral voice insights

Scope is limited to extracting explicitly supported emotion labels, entry reason, strategy, and plan deviation from user-confirmed transcription text. Trade-list functionality and every later step are intentionally absent.

## Delivered

- Extraction only from a `CONFIRMED` Step 21 transcription; raw audio and unconfirmed candidate text are not accepted as the source.
- Strict structured output for emotions, entry reason, strategy, plan-deviation status/explanation, and short evidence quotes.
- `null` and `UNKNOWN` are required when the confirmed text does not support a field.
- Diagnostic-language validation rejects medical or psychological diagnoses in any extracted string.
- Fixed safety boundary plus exact model and prompt versions are stored with every result.
- Owner-scoped create and read APIs, with one immutable extraction per transcription.
- Region-configurable provider with a 30-second timeout and fail-closed behavior.
- Mobile API helpers expose the result and its safety boundary.

## API

- `POST /voice-transcriptions/:transcriptionId/insights`
- `GET /voice-insights/:insightId`

## Configuration

```env
INSIGHT_MODEL_ENDPOINT=
INSIGHT_MODEL_API_KEY=
INSIGHT_MODEL_NAME=
```

Configure the provider independently per deployment region. Without configuration, extraction returns `503` and creates no database row.

## Safety acceptance

- Output is behavioral reflection, not medical advice.
- The prompt explicitly prohibits diagnosis.
- The output schema rejects common English and Chinese diagnostic terminology.
- Evidence quotes are bounded and required to remain traceable to the confirmed note.

## Acceptance

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm check
```
