# Wenyan Agent

[中文说明](./README.zh-CN.md)

Wenyan Agent is a Next.js application for generating classical Chinese answers from vernacular or classical Chinese input. It normalizes the user question first, then returns multiple classical-style variants together with modern Chinese explanations, line-by-line glosses, and persona-flavored outputs.

## What It Does

- Accepts vernacular Chinese or classical Chinese input.
- Normalizes the request into a concise modern Chinese semantic draft.
- Generates multiple classical Chinese answer variants.
- Returns literal explanation, free explanation, and gloss-style notes.
- Supports persona-style output based on local historical source snippets.
- Can run with a mock provider, a local Ollama model, or an OpenAI-compatible API.
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

2. Copy the example environment file.

```powershell
Copy-Item .env.example .env
```

3. Choose a provider in `.env`.

Mock demo:

```env
MODEL_PROVIDER=mock
```

Local Ollama:

```env
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
MODEL_NAME=qwen3:4b
```

OpenAI-compatible API:

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4.1-mini
```

4. If you use Ollama, prepare the model first.

```powershell
ollama serve
ollama pull qwen3:4b
```

5. Start the development server.

```powershell
cmd /c npm run dev
```

6. Open the app in your browser.

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
cmd /c npm run ingest:personas
cmd /c npm run ingest:knowledge
cmd /c npm run reindex
```

## Environment Variables

- `MODEL_PROVIDER`: `mock`, `ollama`, or `openai`
- `MODEL_NAME`: model name for API providers
- `OPENAI_API_BASE_URL`: base URL for an OpenAI-compatible endpoint
- `OPENAI_API_KEY`: API key for OpenAI-compatible access
- `OLLAMA_BASE_URL`: local Ollama server address
- `OLLAMA_MODEL`: local Ollama model name
- `DATABASE_URL`: reserved for future persistence work
- `DEFAULT_VARIANTS_COUNT`: default number of generated variants
- `DEFAULT_EXPLANATION_MODES`: comma-separated explanation modes

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

- [Architecture](./docs/architecture.md)
- [API Notes](./docs/api.md)
- [Data Ingestion](./docs/data-ingestion.md)
- [Contributing](./CONTRIBUTING.md)

## Development Flow

- Work on `dev` first.
- Keep request and response types stable.
- Prefer extending `lib/domain/` and `lib/infra/` instead of inflating route handlers.
- Promote to `main` only after validation and release review.

## Notes

- The external project shape is intentionally stable so you can replace the internal model provider, retrieval layer, or persistence implementation later without rebuilding the whole app shell.
- The repository currently favors pragmatic local development over a fully productionized deployment setup.
