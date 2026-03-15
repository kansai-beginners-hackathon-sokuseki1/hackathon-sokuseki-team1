# AI Secrets For Cloudflare Workers

This backend reads AI provider settings from the Worker environment in `backend/src/ai.js`.

Relevant keys:

- `DEFAULT_AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

## Local Worker development

`wrangler.toml` lives under [backend/wrangler.toml](/C:/Users/paramaster/Desktop/hackathon/Mock/backend/wrangler.toml), so local Worker secrets and vars should be stored under `backend/`, not the repository root.

Create `backend/.dev.vars` from [backend/.dev.vars.example](/C:/Users/paramaster/Desktop/hackathon/Mock/backend/.dev.vars.example) and fill in only the providers you actually use.

Example:

```env
DEFAULT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=google/gemini-2.5-flash
```

Then run:

```bash
cd backend
npm run dev
```

## Deployed Worker secrets

Cloudflare recommends storing sensitive values as Worker secrets. Set API keys with `wrangler secret put`.

Examples:

```bash
cd backend
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
```

Non-secret defaults such as provider and model can stay in code defaults, or you can define them as Worker vars if you want deployment-specific behavior.

## Verification

After setting secrets:

1. Start the backend Worker locally with `cd backend && npm run dev`, or deploy with `npm --prefix backend run deploy`.
2. Open the app and use the AI connection test in settings.
3. If the test fails, check which provider is selected and whether its matching API key exists in the Worker environment.

## Notes

- Do not commit `backend/.dev.vars`.
- The repository root `.env` is not the source of truth for Wrangler when `wrangler.toml` is inside `backend/`.
- If you use server-default AI settings in the app, the Worker must have the matching provider key configured.

