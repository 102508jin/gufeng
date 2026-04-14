# API &#x8BF4;&#x660E;

[English version](./api.md)

## POST /api/generate

&#x8BF7;&#x6C42;&#x4F53; &#x793A;&#x4F8B;:

```json
{
  "query": "\u6700\u8fd1\u603b\u662f\u62d6\u5ef6\uff0c\u600e\u4e48\u575a\u6301\u8ba1\u5212\uff1f",
  "inputMode": "auto",
  "personaId": "zhuge-liang",
  "variantsCount": 3,
  "explanationModes": ["literal", "free", "gloss"]
}
```

&#x4E3B;&#x8981; &#x8FD4;&#x56DE; &#x5B57;&#x6BB5;:

- `normalizedQuery`
- `detectedInputMode`
- `persona`
- `variants[]`
- `retrievalRefs[]`
- `debug`

## GET /api/personas

&#x8FD4;&#x56DE; &#x672C;&#x5730; corpus &#x4E2D; &#x53EF;&#x7528; &#x7684; persona profile.

## POST /api/knowledge/reindex

&#x6839;&#x636E; processed corpus &#x91CD;&#x5EFA; &#x672C;&#x5730; index state file.

## GET /api/health

&#x8FD4;&#x56DE; &#x670D;&#x52A1; &#x72B6;&#x6001; &#x548C; timestamp.
