# Deployment

## Cloudflare Worker

This repository deploys the frontend build and the API from the same Cloudflare Worker.

1. Build the frontend from the repository root.
   `npm run build`
2. Apply remote D1 migrations before the first public release and after every new migration.
   `npm --prefix backend run db:migrate:remote`
3. Deploy the backend Worker, which also uploads `dist/` as static assets.
   `npm --prefix backend run deploy`

After deployment:

- The application is served from the Worker root path `/`.
- The API remains available at `/api`.
