# Wenyan Agent

[Chinese README](./README.zh-CN.md)

Wenyan Agent is a Next.js application for generating classical Chinese answers from vernacular or classical Chinese input. It normalizes the user question first, then returns multiple classical-style variants together with modern Chinese explanations, line-by-line glosses, and persona-flavored outputs.

## What It Does

- Accepts vernacular Chinese or classical Chinese input.
- Normalizes the request into a concise modern Chinese semantic draft.
- Generates multiple classical Chinese answer variants.
- Returns literal explanation, free explanation, and gloss-style notes.
- Supports persona-style output based on local historical source snippets.
- Can run with `mock`, local Ollama, OpenAI-compatible APIs, or Anthropic / Claude.
- Supports per-request driver switching from the UI and API.
- Stores a local user profile and response preferences in browser `localStorage`.
- Adds per-request AI intervention control: conservative, balanced, or creative.
- Adds RAG retrieval control: off, focused, standard, or broad.
- Provides a knowledge-base preview flow through the UI and `GET /api/knowledge/search`.
- Adds local history, favorites, copy actions, and Markdown / JSON export.
- Adds pure local profiles with isolated preferences, history, and favorites.
- Supports local profile JSON backup export / import for offline migration.
- Adds workspace knowledge import for local TXT / JSON documents.
- Adds per-answer local feedback buttons for lightweight quality tracking.
- `npm run dev` probes for an available port instead of assuming port 3000.
- Ships with a Chinese UI and Chinese-facing output labels.

## Current Status

- Frontend stack: Next.js 15 + React 19 + TypeScript
- Validation: Zod
- Local retrieval: file-backed seed corpus under `data/`
- Local model runtime: tested with Ollama and `qwen3:4b`
- Branch workflow: `dev` for active development, `main` for stable promotion

## Quick Start

1. Install dependencies.

```powershell
cmd /c npm install
```

2. Copy the example environment file for local secrets.

```powershell
Copy-Item .env.example .env.local
```

3. Choose a default provider in `.env.local`.

Mock demo:

```env
MODEL_PROVIDER=mock
DEFAULT_PROVIDER_ID=mock
```

Local Ollama:

```env
MODEL_PROVIDER=ollama
DEFAULT_PROVIDER_ID=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
MODEL_NAME=qwen3:4b
```

OpenAI-compatible API:

```env
MODEL_PROVIDER=openai
DEFAULT_PROVIDER_ID=openai
OPENAI_API_KEY=your_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4.1-mini
```

Anthropic / Claude:

```env
MODEL_PROVIDER=anthropic
DEFAULT_PROVIDER_ID=anthropic
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

Optional extra runtime-selectable profiles:

```env
MODEL_PROFILES_JSON=[{"id":"vllm","label":"vLLM","driver":"openai-compatible","baseUrl":"http://127.0.0.1:8000/v1","model":"Qwen/Qwen3-4B-Instruct"},{"id":"sglang","label":"SGLang","driver":"openai-compatible","baseUrl":"http://127.0.0.1:30000/v1","model":"Qwen/Qwen3-4B-Instruct"}]
DEFAULT_PROVIDER_ID=vllm
```

Custom profile secrets must be referenced with `apiKeyEnv`; inline `apiKey` values in `MODEL_PROFILES_JSON` are ignored.

4. If you use Ollama, prepare the model first.

```powershell
ollama serve
ollama pull qwen3:4b
```

5. Start the development server.

```powershell
cmd /c npm run dev
```

The script starts from `PORT` or `--port` when provided, then automatically falls forward if that port is busy.

```powershell
cmd /c npm run dev -- --port 3000
```

6. Open the local URL printed by the terminal.

```text
http://localhost:3000
```

## Windows Note

If PowerShell blocks `npm.ps1`, use `cmd /c npm ...` instead of calling `npm` directly. Example:

```powershell
cmd /c npm run build
cmd /c npm run start
```

## Available Scripts

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
cmd /c npm run test
cmd /c npm run eval:quality
cmd /c npm run ingest:personas
cmd /c npm run ingest:knowledge
cmd /c npm run reindex
cmd /c npm run verify
```

## Environment Variables

- `MODEL_PROVIDER`: legacy-compatible default driver selector
- `DEFAULT_PROVIDER_ID`: default runtime profile id
- `MODEL_PROFILES_JSON`: optional JSON array for extra runtime-selectable profiles
- `MODEL_NAME`: model name for API providers
- `OPENAI_PROVIDER_LABEL`: UI label for the built-in OpenAI-compatible slot
- `OPENAI_API_BASE_URL`: base URL for an OpenAI-compatible endpoint
- `OPENAI_API_KEY`: API key for OpenAI-compatible access
- `OLLAMA_PROVIDER_LABEL`: UI label for the built-in Ollama slot
- `OLLAMA_BASE_URL`: local Ollama server address
- `OLLAMA_MODEL`: local Ollama model name
- `ANTHROPIC_PROVIDER_LABEL`: UI label for the built-in Anthropic slot
- `ANTHROPIC_BASE_URL`: Anthropic-compatible base URL
- `ANTHROPIC_API_KEY`: API key for Anthropic access
- `ANTHROPIC_MODEL`: Anthropic model name
- `DATABASE_URL`: reserved for future persistence work
- `DEFAULT_VARIANTS_COUNT`: default number of generated variants
- `DEFAULT_EXPLANATION_MODES`: comma-separated explanation modes
- `MODEL_REQUEST_TIMEOUT_MS`: timeout for each external model request
- `EMBEDDING_PROVIDER`: `local` or `openai-compatible`; defaults to offline local hashing
- `EMBEDDING_MODEL`: model name for OpenAI-compatible embedding providers
- `EMBEDDING_API_BASE_URL`: base URL for an OpenAI-compatible `/embeddings` endpoint
- `EMBEDDING_API_KEY`: optional for local compatible servers, required for `api.openai.com`
- `EMBEDDING_DIMENSIONS`: vector size for the local hashing embedding provider

## Driver Notes

- `openai-compatible` covers OpenAI-style `/chat/completions` endpoints, including custom API gateways and local engines that expose the same protocol.
- `ollama` uses `/api/generate`.
- `anthropic` uses `/v1/messages`.
- `EMBEDDING_PROVIDER=openai-compatible` uses an OpenAI-style `/embeddings` endpoint; the default `local` provider is deterministic and offline.
- Custom profiles should use `apiKeyEnv` instead of inline `apiKey`.
- `GET /api/providers` returns the runtime-selectable driver list for the frontend.

## Project Structure

- `app/`: Next.js app routes and API handlers
- `components/`: UI building blocks
- `lib/domain/`: core generation, normalization, explanation, retrieval logic
- `lib/services/`: orchestration layer
- `lib/infra/`: model providers, repositories, and infrastructure adapters
- `data/`: sample persona and knowledge corpora
- `docs/`: architecture and API notes
- `scripts/`: ingestion and indexing helpers
- `tests/`: test cases

## Documentation

- Chinese translations are available for the contributor guide, architecture notes, API notes, data-ingestion notes, deployment notes, and the license note.
- [Architecture](./docs/architecture.md)
- [API Notes](./docs/api.md)
- [Data Ingestion](./docs/data-ingestion.md)
- [Deployment Checklist](./docs/deployment.md)
- [Optimization Plan](./docs/optimization-plan.zh-CN.md)
- [Contributing](./CONTRIBUTING.md)
- [Chinese License Note](./LICENSE.zh-CN.md)

## Development Flow

- Work on `dev` first.
- Keep request and response types stable.
- Prefer extending `lib/domain/` and `lib/infra/` instead of inflating route handlers.
- Promote to `main` only after validation and release review.

## Notes

- The external project shape is intentionally stable so you can replace the internal model provider, retrieval layer, or persistence implementation later without rebuilding the whole app shell.
- The repository favors pragmatic local deployment with explicit health checks, quality evals, and offline fallbacks.
