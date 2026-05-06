# Data Ingestion

[Chinese version](./data-ingestion.zh-CN.md)

The repository ships with raw sample documents under `data/raw/knowledge/` and processed retrieval chunks under `data/processed/`.

Current knowledge ingestion workflow:

1. Add one or more JSON files under `data/raw/knowledge/`.
2. Include required metadata: `id`, `title`, `category`, `source`, `license`, `content`, `credibility`, and `updatedAt`.
3. Run `npm run ingest:knowledge`.
4. The script validates metadata, cleans text, chunks each document, and writes `data/processed/knowledge.json`.
5. Each processed record includes `documentId`, `chunkId`, `chunkIndex`, source, license, era, credibility, and update time.
6. Run `npm run reindex` to build `data/processed/vector-index.json` for persisted local document vectors.

Users can also import local documents from the workspace UI. The UI calls `POST /api/knowledge/import`, appends documents to `data/raw/knowledge/user-imports.json`, and rebuilds the processed corpus plus vector index.

Available scripts:

- `npm run ingest:personas`
- `npm run ingest:knowledge`
- `npm run reindex`

Embedding generation now goes through an `EmbeddingProvider` abstraction. The default provider is local hashing embedding, and `EMBEDDING_PROVIDER=openai-compatible` can call an OpenAI-compatible `/embeddings` endpoint. `npm run reindex` always persists document vectors to `data/processed/vector-index.json`; when `VECTOR_STORE=chroma`, it also upserts the same knowledge chunks into Chroma.

## Current Knowledge Retrieval

- `LocalSourceRetriever` loads local knowledge entries through `dataRepository.listKnowledge()` and ranks them with the configured vector store.
- `/api/knowledge/search?q=...&topK=...` can be used to preview RAG matches before generation.
- `/api/knowledge/reindex` writes `data/processed/index-state.json` and `data/processed/vector-index.json`.
- Search responses include source, license, chunk id, score, and excerpt data so citations stay traceable.
- `VECTOR_STORE=local` uses `InMemoryVectorStore` and reuses persisted document vectors when the embedding provider fingerprint and content hash match.
- `VECTOR_STORE=chroma` uses the Chroma HTTP API for knowledge search, with local vector search as a fallback if Chroma is unavailable.

## Embedding Configuration

- `EMBEDDING_PROVIDER=local` uses deterministic local hashing vectors and requires no network.
- `EMBEDDING_PROVIDER=openai-compatible` calls `${EMBEDDING_API_BASE_URL}/embeddings`.
- `EMBEDDING_MODEL` selects the embedding model for OpenAI-compatible providers.
- `EMBEDDING_API_KEY` is optional for local OpenAI-compatible servers, but required for `api.openai.com`.
- `EMBEDDING_DIMENSIONS` controls local hashing vector size.

## Chroma Configuration

- `VECTOR_STORE=chroma` enables Chroma for knowledge search and reindex upserts.
- `CHROMA_BASE_URL` defaults to `http://127.0.0.1:8000`.
- `CHROMA_TENANT`, `CHROMA_DATABASE`, and `CHROMA_COLLECTION` select the Chroma namespace.
- `CHROMA_TOKEN` is sent as `x-chroma-token` when set.
- Run `npm run reindex` after enabling Chroma so the collection is created and populated.
