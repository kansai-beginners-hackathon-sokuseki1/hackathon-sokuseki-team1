# Google Sign-In Setup

## Required values

- Frontend: `VITE_GOOGLE_CLIENT_ID`
- Backend worker: `GOOGLE_CLIENT_ID`

Use the same Google OAuth Web client ID for both values.

## Frontend local setup

Add this to your local `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

## Backend local setup

For local Worker development, add the same value to your Wrangler local secrets or vars.

Example:

```bash
cd backend
npx wrangler secret put GOOGLE_CLIENT_ID
```

## Production setup

Set `GOOGLE_CLIENT_ID` in the deployed Worker environment and make sure the Google OAuth client allows your production origin.

## Behavior

- Local email/password auth continues to work.
- Google accounts are created with `auth_provider = google`.
- If the same email already exists as a local account, Google sign-in is rejected instead of auto-linking.
- Google-only accounts must continue using Google sign-in.
