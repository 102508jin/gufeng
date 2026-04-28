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

`debug` includes `aiIntervention`, `retrievalMode`, and `userContextApplied` for request-level traceability.

## GET /api/personas

Returns all available persona profiles from the local corpus.

## GET /api/providers

Returns all runtime-selectable model profiles for the frontend. Each item includes `id`, `label`, `driver`, `model`, `configured`, and `isDefault`.

## POST /api/knowledge/reindex

Rebuilds the local index state file from the processed corpus.

## GET /api/knowledge/search

Searches the local knowledge corpus before generation so users can preview RAG matches.

Query params:

- `q`: required search text.
- `topK`: optional integer from 1 to 10, default `5`.

Example:

```text
/api/knowledge/search?q=拖延%20自律&topK=4
```

Returns `SourceRef[]` with `title`, `excerpt`, `score`, and `sourceType`.

## GET /api/health

Returns a health status and timestamp.
