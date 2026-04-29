# &#x6570;&#x636E; &#x5BFC;&#x5165; &#x8BF4;&#x660E;

[English version](./data-ingestion.md)

仓库目前自带 `data/raw/knowledge/` 下的 raw sample documents, 以及 `data/processed/` 下的 processed retrieval chunks.

当前 knowledge ingestion workflow:

1. 在 `data/raw/knowledge/` 下添加一个或多个 JSON 文件.
2. 必填 metadata: `id`, `title`, `category`, `source`, `license`, `content`, `credibility`, `updatedAt`.
3. 运行 `npm run ingest:knowledge`.
4. 脚本会校验 metadata、清洗文本、按 retrieval unit 切分文档, 并写入 `data/processed/knowledge.json`.
5. 每条 processed record 都包含 `documentId`, `chunkId`, `chunkIndex`, source, license, era, credibility 和 update time.
6. 运行 `npm run reindex` 生成 `data/processed/vector-index.json`, 用于持久化本地文档向量.

可用 script:

- `npm run ingest:personas`
- `npm run ingest:knowledge`
- `npm run reindex`

Embedding 生成已通过 `EmbeddingProvider` 抽象接入. 默认使用本地 hashing embedding, 也可以通过 `EMBEDDING_PROVIDER=openai-compatible` 调用 OpenAI-compatible `/embeddings` 接口. `npm run reindex` 会把文档向量持久化到 `data/processed/vector-index.json`; 外部向量数据库仍是后续工作.

## 当前知识库检索

- `LocalSourceRetriever` 会从 `dataRepository.listKnowledge()` 读取本地知识条目, 再交给 `InMemoryVectorStore` 排序.
- `/api/knowledge/search?q=...&topK=...` 可用于生成前验证 RAG 命中片段.
- `/api/knowledge/reindex` 会写入 `data/processed/index-state.json` 和 `data/processed/vector-index.json`.
- 查询响应会包含 source, license, chunk id, score 和 excerpt, 保证引用可追溯.
- 当前排序实现仍是内存检索, 但会在 embedding provider fingerprint 和 content hash 匹配时复用已持久化的文档向量.
- 后续接入外部向量库时应保持 `SourceRetriever` 接口不变, 只替换 `lib/infra/vector/` 适配器.

## Embedding 配置

- `EMBEDDING_PROVIDER=local` 使用确定性的本地 hashing vector, 不需要网络.
- `EMBEDDING_PROVIDER=openai-compatible` 会调用 `${EMBEDDING_API_BASE_URL}/embeddings`.
- `EMBEDDING_MODEL` 用于选择 OpenAI-compatible embedding model.
- `EMBEDDING_API_KEY` 对本地 OpenAI-compatible 服务可选; 使用 `api.openai.com` 时必填.
- `EMBEDDING_DIMENSIONS` 控制本地 hashing vector 维度.
