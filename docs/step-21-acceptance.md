# Step 21 acceptance — voice transcription

Scope is limited to transcription, explicit user confirmation of text, and optional source-audio deletion after confirmation. Emotion, reason, strategy, or psychological extraction belongs to Step 22 and is intentionally absent.

## Delivered

- Authenticated, owner-scoped transcription of private Step 20 recordings.
- Region-configurable speech-to-text provider with a 60-second timeout and fail-closed behavior.
- Candidate text is stored separately from user-confirmed text.
- Confirmation requires non-empty user-submitted text and may correct the candidate.
- Exact speech model and prompt versions are retained.
- Independent user preference for deleting original audio after confirmation; default is off.
- When enabled, confirmation marks the object deleted and removes it from private storage while retaining transcription provenance.
- Deleted source audio can no longer be downloaded or retranscribed.
- Mobile API helpers for transcription, confirmation, and retention preference.

## API

- `POST /voice-recordings/:recordingId/transcribe`
- `GET /voice-transcriptions/:transcriptionId`
- `POST /voice-transcriptions/:transcriptionId/confirm`
- `PUT /users/me/preferences/voice-retention`

## Configuration

```env
TRANSCRIPTION_MODEL_ENDPOINT=
TRANSCRIPTION_MODEL_API_KEY=
TRANSCRIPTION_MODEL_NAME=
```

Configure the provider independently per deployment region. Without configuration, transcription returns `503` and no candidate row is created.

## Acceptance

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm --filter @rulivo/mobile test
pnpm check
```
