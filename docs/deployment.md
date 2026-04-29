# Deployment Checklist

[Chinese version](./deployment.zh-CN.md)

This project is designed for local-first deployment. The default `mock` model and local hashing embedding provider work without external services, so the app can be validated before API credentials are configured.

## Local Deployment Steps

1. Install dependencies.

```powershell
npm install
```

2. Create local environment variables.

```powershell
Copy-Item .env.example .env.local
```

3. Configure the model provider in `.env.local`.

- Keep `DEFAULT_PROVIDER_ID=mock` for offline validation.
- Use `ollama`, `openai`, or `anthropic` only after the relevant local service or API key is available.
- Keep `EMBEDDING_PROVIDER=local` unless an OpenAI-compatible `/embeddings` endpoint is ready.

4. Rebuild corpus and vector index.

```powershell
npm run ingest:knowledge
npm run reindex
```

5. Run the full deployment check.

```powershell
npm run verify
```

6. Start production mode.

```powershell
npm run start
```

7. Check runtime health.

```text
GET /api/health
```

The response should return `status: "ok"`. A `degraded` status means the corpus, model profiles, embedding provider, or vector index needs attention before release.

## Docker Deployment

Build the image:

```powershell
docker build -t wenyan-agent .
```

Run with the offline defaults:

```powershell
docker run --rm -p 3000:3000 wenyan-agent
```

Run with a real provider by passing environment variables:

```powershell
docker run --rm -p 3000:3000 `
  -e DEFAULT_PROVIDER_ID=openai `
  -e OPENAI_API_KEY=... `
  -e OPENAI_API_BASE_URL=https://api.openai.com/v1 `
  wenyan-agent
```

The image rebuilds the processed corpus and local vector index during build. Rebuild the image after changing files under `data/raw/knowledge/`.

## Required Release Gates

- `npm run ingest:knowledge` succeeds.
- `npm run reindex` generates `data/processed/vector-index.json`.
- `npm test` passes.
- `npm run eval:quality` passes all fixed evaluation cases.
- `npm run build` passes.
- `GET /api/health` returns `ok`.
- Docker image builds successfully if container deployment is required.

## Privacy and Secrets

- Do not commit `.env`, `.env.local`, API keys, tokens, cookies, or private user backups.
- Use `MODEL_PROFILES_JSON` with `apiKeyEnv`; do not place inline keys in JSON.
- Use synthetic evaluation cases and sample corpus entries for tests.
- Keep local profile data in browser `localStorage`; do not add remote sync unless the product direction changes.

## Rollback

- Revert provider settings to `DEFAULT_PROVIDER_ID=mock` and `EMBEDDING_PROVIDER=local` to restore offline operation.
- Re-run `npm run ingest:knowledge` and `npm run reindex` after corpus or embedding changes.
- If vector index health is stale, delete and rebuild `data/processed/vector-index.json` with `npm run reindex`.
