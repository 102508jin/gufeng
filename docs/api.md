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

## GET /api/providers

Returns all runtime-selectable model profiles for the frontend. Each item includes `id`, `label`, `driver`, `model`, `configured`, and `isDefault`.

## POST /api/knowledge/reindex

Rebuilds the local index state file from the processed corpus.

## GET /api/health

Returns a health status and timestamp.
