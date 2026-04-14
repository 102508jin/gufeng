# Data Ingestion

[Chinese version](./data-ingestion.zh-CN.md)

The repository currently ships with processed sample data under `data/processed/`.

Future ingestion workflow:

1. Collect persona source texts and explanation references.
2. Clean the raw source files and normalize metadata.
3. Chunk documents into retrieval units.
4. Generate embeddings with the chosen embedding model.
5. Persist chunk metadata to the relational store and vectors to the vector store.

Current placeholder scripts:

- `npm run ingest:personas`
- `npm run ingest:knowledge`
- `npm run reindex`

These scripts currently validate and rewrite the sample dataset so the file format stays stable while the corpus is still small.
