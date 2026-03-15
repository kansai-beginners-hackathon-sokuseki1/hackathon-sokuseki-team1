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

## AI secrets

If you want server-default AI scoring to work in the deployed Worker, set the provider API key as a Cloudflare Worker secret before deployment.

Examples:

```bash
cd backend
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
```

For local Worker development, use `backend/.dev.vars`. See [docs/operations/ai-secrets.md](/C:/Users/paramaster/Desktop/hackathon/Mock/docs/operations/ai-secrets.md).
