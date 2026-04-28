# &#x6570;&#x636E; &#x5BFC;&#x5165; &#x8BF4;&#x660E;

[English version](./data-ingestion.md)

&#x4ED3;&#x5E93; &#x76EE;&#x524D; &#x81EA;&#x5E26; `data/processed/` &#x4E0B; &#x7684; sample corpus.

&#x540E;&#x7EED; ingestion workflow &#x53EF;&#x4EE5; &#x6309; &#x4EE5;&#x4E0B; &#x6B65;&#x9AA4; &#x6269;&#x5C55;:

1. &#x6536;&#x96C6; persona source text &#x548C; explanation reference
2. &#x6E05;&#x7406; raw source file &#x5E76; &#x7EDF;&#x4E00; metadata
3. &#x6309; retrieval unit &#x5207;&#x5206; document
4. &#x4F7F;&#x7528; embedding model &#x751F;&#x6210; vector
5. &#x5C06; metadata &#x5199;&#x5165; relational store, vector &#x5199;&#x5165; vector store

&#x5F53;&#x524D; placeholder script:

- `npm run ingest:personas`
- `npm run ingest:knowledge`
- `npm run reindex`

&#x8FD9;&#x4E9B; script &#x76EE;&#x524D; &#x4E3B;&#x8981; &#x7528;&#x6765; &#x6821;&#x9A8C; &#x5E76; &#x91CD;&#x5199; sample dataset, &#x4EE5; &#x4FDD;&#x6301; &#x6587;&#x4EF6; &#x683C;&#x5F0F; &#x7A33;&#x5B9A;.

## 当前知识库检索

- `LocalSourceRetriever` 会从 `dataRepository.listKnowledge()` 读取本地知识条目, 再交给 `InMemoryVectorStore` 排序.
- `/api/knowledge/search?q=...&topK=...` 可用于生成前验证 RAG 命中片段.
- `/api/knowledge/reindex` 会写入 `data/processed/index-state.json`, 用于记录当前样例 corpus 的重建状态.
- 当前实现仍是内存检索; 后续接入外部向量库时应保持 `SourceRetriever` 接口不变, 只替换 `lib/infra/vector/` 适配器.
