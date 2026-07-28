# Step 20 acceptance — private voice recording

Scope is limited to recording, pause/resume, deletion, duration display, permission explanation, and private upload. Speech-to-text and every later step are intentionally absent.

## Delivered

- Expo microphone permission request with an explicit in-app explanation and native permission copy.
- Start, pause, resume, stop, and local file deletion.
- Live `MM:SS` elapsed-duration display.
- Mobile multipart upload client requiring a real bearer token.
- Authenticated private upload, owner-only content access, and deletion APIs.
- M4A and WebM container-signature validation; MIME headers alone are not trusted.
- 25 MiB file limit and one-hour duration limit at both API and database boundaries.
- Optional trade association with tenant ownership validation.
- Private object keys only; the storage directory is not exposed as static content.

## API

- `POST /voice-recordings`
- `GET /voice-recordings/:recordingId/content`
- `DELETE /voice-recordings/:recordingId`

No transcript column, transcription model call, or transcription job exists in this step.

## Acceptance

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm --filter @rulivo/mobile test
pnpm check
```

The existing mobile demo session still has no real API access token. Recording and local deletion work on-device; authenticated upload becomes active when the login integration supplies its bearer token.
