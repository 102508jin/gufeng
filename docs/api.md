# API

[Chinese version](./api.zh-CN.md)

## POST /api/generate

Request body:

```json
{
  "query": "\u6700\u8fd1\u603b\u662f\u62d6\u5ef6\uff0c\u600e\u4e48\u575a\u6301\u8ba1\u5212\uff1f",
  "inputMode": "auto",
  "personaId": "zhuge-liang",
  "providerId": "ollama",
  "variantsCount": 3,
  "explanationModes": ["literal", "free", "gloss"],
  "aiIntervention": "balanced",
  "retrievalMode": "auto",
  "userContext": {
    "displayName": "Shen Yi",
    "useCase": "classroom explanation",
    "preference": "start with actionable advice and keep explanations concise"
  }
}
```

Optional fields:

- `aiIntervention`: AI intervention level, one of `conservative`, `balanced`, `creative`; default `balanced`.
- `retrievalMode`: knowledge retrieval depth, one of `off`, `focused`, `auto`, `broad`; default `auto`.
- `userContext`: local user profile with `displayName`, `useCase`, and `preference`.

Response shape:

- `normalizedQuery`
- `detectedInputMode`
- `persona`
- `variants[]`
- `retrievalRefs[]`
- `debug`

`debug` includes `aiIntervention`, `retrievalMode`, `userContextApplied`, `primaryProviderId`, `fallbackProviderId`, and `fallbackReason` for request-level traceability.

## GET /api/personas

Returns all available persona profiles from the local corpus.

## GET /api/providers

Returns all runtime-selectable model profiles for the frontend. Each item includes `id`, `label`, `driver`, `model`, `configured`, and `isDefault`.

## POST /api/knowledge/reindex

Rebuilds the local index state file and persisted vector index from the processed corpus. The response includes `personas`, `knowledge`, `vectorDocuments`, `embeddingProvider`, and `updatedAt`.

## POST /api/knowledge/import

Imports user-provided local knowledge documents into `data/raw/knowledge/user-imports.json`, rebuilds `data/processed/knowledge.json`, and refreshes `data/processed/vector-index.json`.

Request body:

```json
{
  "documents": [
    {
      "title": "Discipline Notes",
      "category": "discipline",
      "source": "user-import",
      "license": "user-provided",
      "content": "Imported local knowledge text.",
      "keywords": ["discipline", "planning"],
      "credibility": "medium"
    }
  ]
}
```

Returns `imported`, `totalRawDocuments`, `processedChunks`, `vectorDocuments`, and `updatedAt`.

## GET /api/knowledge/search

Searches the local knowledge corpus before generation so users can preview RAG matches.

Query params:

- `q`: required search text.
- `topK`: optional integer from 1 to 10, default `5`.

Example:

```text
/api/knowledge/search?q=拖延%20自律&topK=4
```

Returns `SourceRef[]` with `title`, `excerpt`, `score`, `sourceType`, `source`, `license`, `chunkId`, and `documentId`.

## GET /api/health

Returns runtime readiness information without secrets. The response includes `status`, `checks`, corpus counts, model profile status, embedding provider status, and vector index freshness. Returns HTTP `200` when `status` is `ok`, and HTTP `503` when `status` is `degraded`.
