# Architecture

[Chinese version](./architecture.zh-CN.md)

The project uses a stable five-layer structure:

- `app/` and `components/` handle presentation and route wiring.
- `lib/services/` orchestrates complete business flows.
- `lib/domain/` contains stable capability modules such as normalization, generation, explanation, and retrieval.
- `lib/infra/` isolates external dependencies like LLM providers, file-backed repositories, logging, and vector search adapters.
- `data/processed/` stores the local RAG seed corpus for personas and explanation knowledge.

The default runtime uses the `mock` provider so the end-to-end flow works before API credentials are configured. Switching to OpenAI-compatible, Ollama-compatible, Anthropic, or custom OpenAI-compatible profiles is driven by environment configuration plus request-scoped browser overrides.

## Current User Flow

1. `components/workspace.tsx` owns the question, persona, provider, local user profile, AI intervention level, RAG retrieval depth, provider endpoint overrides, and max output token budget.
2. The local user profile, recent question history, and favorite answers are stored only in browser `localStorage`; each generation request sends the profile as `userContext`.
3. Provider settings are stored in browser `localStorage`; each generation request may send `providerOverrides` for built-in endpoint URLs and `maxCompletionTokens`.
4. `/api/generate` validates the payload with `generateRequestSchema`, then delegates to `GenerateService`.
5. `GenerateService` resolves the provider, applies request-scoped overrides, normalizes input, retrieves persona context, searches the knowledge corpus, and orchestrates generation and explanation.
6. `GenerationContext` carries `aiIntervention`, `retrievalMode`, and `userContext` for prompt building and fallback generation.
7. `/api/knowledge/search` reuses `KnowledgeService` and `LocalSourceRetriever` so the UI can preview knowledge matches before generation.
8. `/api/providers/test` resolves the same effective provider and performs a lightweight metadata request without returning secrets.

## Local Workspace Memory

- `lib/utils/workspace-memory.ts` owns history, favorites, export formatting, and storage guards.
- User management is designed for pure local deployment: no login and no external server.
- `LocalWorkspaceProfile` represents a local profile; each profile has isolated `userContext`, history, and favorites.
- History keeps the latest 20 entries with the question, generation settings, persona, provider, provider overrides, topics, and normalized query.
- Favorite answers store the classical text, explanations, sources, and topics; the UI can filter by persona and topic.
- Current results can be exported as Markdown / JSON, and individual favorites can be exported as Markdown.
- Profiles can be exported and imported as JSON backups for offline migration.
- Legacy global `localStorage` data is migrated into the default profile on first load.

## Development Server Ports

- `npm run dev` executes `scripts/dev-server.ts`.
- The script starts from `PORT` or `--port`, defaulting to 3000.
- If the port is busy, it scans forward and passes the selected port to `next dev --port`.

## RAG and AI Intervention

- `retrievalMode=off` disables knowledge-corpus retrieval but still allows selected persona style context.
- `focused`, `auto`, and `broad` retrieve 2, 4, and 6 knowledge snippets.
- `aiIntervention=conservative` lowers model temperature and asks the model to stay closer to the question and sources.
- `aiIntervention=creative` raises generation temperature while still forbidding fake citations.
- The mock provider remains deterministic and reflects the intervention level in style notes.
- External provider failures fall back to the `mock` provider; the response debug block records the primary provider, fallback provider, and failure reason.
- `maxCompletionTokens` is carried on the effective `ModelProfile`: OpenAI-compatible drivers receive `max_completion_tokens`, Anthropic receives `max_tokens`, and Ollama receives `num_predict`.
- Knowledge retrieval uses the `EmbeddingProvider` abstraction. The default local hashing provider is offline and deterministic; OpenAI-compatible embedding endpoints can be enabled through env vars.
- `npm run reindex` writes a local `data/processed/vector-index.json`; retrieval reuses indexed vectors only when provider fingerprint and document content hash still match.
- `VECTOR_STORE=chroma` switches knowledge retrieval to Chroma and upserts chunks during reindex while preserving the local vector index as fallback.
- The workspace knowledge-import panel writes user documents through `POST /api/knowledge/import`; it never accepts arbitrary filesystem paths from the browser.
- Answer feedback is stored per local browser profile in `localStorage` and exported with profile backups.
