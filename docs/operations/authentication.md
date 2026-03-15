# Authentication

## Supported sign-in methods
- Email and password
- Google sign-in
- Guest sign-in

## Guest sign-in
- The login screen provides a `ゲストで始める` button.
- Guest sign-in creates a dedicated guest user automatically. No email or password input is required.
- Guest users use `auth_provider = guest`.

## Deployment note
- Apply the latest D1 migrations before using guest sign-in.
- Local: `npm --prefix backend run db:migrate:local`
- Remote: `npm --prefix backend run db:migrate:remote`
