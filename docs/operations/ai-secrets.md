# AI Secrets For Cloudflare Workers

This backend reads AI provider settings from the Worker environment in `backend/src/ai.js`.

Relevant keys:

- `DEFAULT_AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_QUEST_MODEL`
- `OPENAI_DIFFICULTY_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

## Local Worker development

`wrangler.toml` lives under [backend/wrangler.toml](/C:/Users/paramaster/Desktop/hackathon/Mock/backend/wrangler.toml), so local Worker secrets and vars should be stored under `backend/`, not the repository root.

Create `backend/.dev.vars` from [backend/.dev.vars.example](/C:/Users/paramaster/Desktop/hackathon/Mock/backend/.dev.vars.example) and fill in only the providers you actually use.

Example:

```env
DEFAULT_AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5
OPENAI_QUEST_MODEL=gpt-4o
OPENAI_DIFFICULTY_MODEL=gpt-4o-mini
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
- The app default is now `openai`, and the settings screen shows a scrollable preset model list for each provider.
- Quest breakdown and difficulty scoring can use separate default models from the general AI default.
