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

Embedding generation now goes through an `EmbeddingProvider` abstraction. The default provider is local hashing embedding, and `EMBEDDING_PROVIDER=openai-compatible` can call an OpenAI-compatible `/embeddings` endpoint. `npm run reindex` persists document vectors to `data/processed/vector-index.json`; external vector databases are still future work.

## Current Knowledge Retrieval

- `LocalSourceRetriever` loads local knowledge entries through `dataRepository.listKnowledge()` and ranks them with `InMemoryVectorStore`.
- `/api/knowledge/search?q=...&topK=...` can be used to preview RAG matches before generation.
- `/api/knowledge/reindex` writes `data/processed/index-state.json` and `data/processed/vector-index.json`.
- Search responses include source, license, chunk id, score, and excerpt data so citations stay traceable.
- The current ranking implementation is still in-memory but reuses persisted document vectors when the embedding provider fingerprint and content hash match.
- A future external vector database should preserve the `SourceRetriever` contract and replace only the adapter under `lib/infra/vector/`.

## Embedding Configuration

- `EMBEDDING_PROVIDER=local` uses deterministic local hashing vectors and requires no network.
- `EMBEDDING_PROVIDER=openai-compatible` calls `${EMBEDDING_API_BASE_URL}/embeddings`.
- `EMBEDDING_MODEL` selects the embedding model for OpenAI-compatible providers.
- `EMBEDDING_API_KEY` is optional for local OpenAI-compatible servers, but required for `api.openai.com`.
- `EMBEDDING_DIMENSIONS` controls local hashing vector size.
