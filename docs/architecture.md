# Architecture

[Chinese version](./architecture.zh-CN.md)

The project uses a stable five-layer structure:

- `app/` and `components/` handle presentation and route wiring.
- `lib/services/` orchestrates complete business flows.
- `lib/domain/` contains stable capability modules such as normalization, generation, explanation, and retrieval.
- `lib/infra/` isolates external dependencies like LLM providers, file-backed repositories, logging, and vector search adapters.
- `data/processed/` stores the local RAG seed corpus for personas and explanation knowledge.

The default runtime uses the `mock` provider so the end-to-end flow works before API credentials are configured. Switching to OpenAI-compatible or Ollama-compatible models should only require environment changes and provider-level refinement.
