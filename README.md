# Wenyan Agent

A web-based Chinese classical-style answering assistant.

## Features

- Accepts vernacular or classical Chinese input.
- Normalizes user input into a modern Chinese semantic draft.
- Produces multiple classical Chinese answer variants.
- Adds line-by-line explanation, free explanation, and gloss notes.
- Supports persona-style outputs based on local historical source snippets.
- Runs with a local mock pipeline by default and can switch to API or Ollama providers.

## Stack

- Next.js + TypeScript
- Zod validation
- File-backed local RAG seed corpus
- Prisma schema for future relational persistence

## Quick Start

1. Copy `.env.example` to `.env`.
2. Keep `MODEL_PROVIDER=mock` for the offline demo, or set `MODEL_PROVIDER=openai` and configure `OPENAI_API_KEY`.
3. Install dependencies with `cmd /c npm install`.
4. Run `cmd /c npm run dev`.

## Important Paths

- `app/` UI entrypoints and route handlers
- `components/` UI blocks
- `lib/services/` orchestration layer
- `lib/domain/` stable core capabilities
- `lib/infra/` provider and storage adapters
- `data/processed/` sample persona and knowledge corpora
- `docs/` architecture and API notes

## Notes

The current repository intentionally keeps the outer architecture stable while using lightweight internal implementations. You can later replace the mock generation logic, in-memory retrieval, or file repository without changing the public API or page structure.

## Branch Flow

- `dev` is the default day-to-day development branch for this local clone.
- `main` is reserved for stable milestones or release-ready states.
- New feature work should branch from `dev` and merge back into `dev` first.
- Promote `dev` into `main` only after validation and release review.
