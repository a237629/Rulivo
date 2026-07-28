# Step 18 acceptance — private image upload

Scope is limited to image acquisition and private upload. Screenshot parsing and AI extraction belong to Step 19 and are intentionally absent.

## Delivered

- Mobile camera and photo-library permission flows with native crop UI.
- Client-side JPEG compression and maximum 2048 px preparation.
- Explicit user-consent switch before upload can be initiated.
- Authenticated multipart upload and owner-only content endpoint.
- Server-side input validation, orientation normalization, maximum dimensions, JPEG recompression, and EXIF/metadata removal.
- Private filesystem object adapter. Objects are not exposed through static routes and database rows contain only object keys.
- `trade_images` metadata table with optional trade ownership validation.

## Configuration

`OBJECT_STORAGE_ROOT` defaults to `.data/private-objects`. Production must point this to an encrypted private volume or replace the adapter with a private object-store implementation. Never mount this path as public static content.

## Acceptance commands

```powershell
pnpm --filter @rulivo/api db:migrate:deploy
pnpm --filter @rulivo/api test
pnpm --filter @rulivo/mobile typecheck
pnpm check
```

The mobile session is still the existing demonstration session and does not hold a real API access token. Image preparation is usable now; authenticated upload is exposed by `uploadPreparedImage` and becomes active when the login integration supplies its access token.
