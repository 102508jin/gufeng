# API

## POST /api/generate

Request body:

```json
{
  "query": "最近总拖延，怎么坚持计划？",
  "inputMode": "auto",
  "personaId": "zhuge-liang",
  "variantsCount": 3,
  "explanationModes": ["literal", "free", "gloss"]
}
```

Response shape:

- `normalizedQuery`
- `detectedInputMode`
- `persona`
- `variants[]`
- `retrievalRefs[]`
- `debug`

## GET /api/personas

Returns all available persona profiles from the local corpus.

## POST /api/knowledge/reindex

Rebuilds the local index state file from the processed corpus.

## GET /api/health

Returns a health status and timestamp.