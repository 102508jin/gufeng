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

用户也可以在工作台 UI 中导入本地文档. UI 会调用 `POST /api/knowledge/import`, 把文档追加到 `data/raw/knowledge/user-imports.json`, 并重建 processed corpus 和 vector index.

可用 script:

- `npm run ingest:personas`
- `npm run ingest:knowledge`
- `npm run reindex`

Embedding 生成已通过 `EmbeddingProvider` 抽象接入. 默认使用本地 hashing embedding, 也可以通过 `EMBEDDING_PROVIDER=openai-compatible` 调用 OpenAI-compatible `/embeddings` 接口. `npm run reindex` 始终会把文档向量持久化到 `data/processed/vector-index.json`; 当 `VECTOR_STORE=chroma` 时, 还会把同一批知识 chunk upsert 到 Chroma.

## 当前知识库检索

- `LocalSourceRetriever` 会从 `dataRepository.listKnowledge()` 读取本地知识条目, 再交给当前配置的 vector store 排序.
- `/api/knowledge/search?q=...&topK=...` 可用于生成前验证 RAG 命中片段.
- `/api/knowledge/reindex` 会写入 `data/processed/index-state.json` 和 `data/processed/vector-index.json`.
- 查询响应会包含 source, license, chunk id, score 和 excerpt, 保证引用可追溯.
- `VECTOR_STORE=local` 使用 `InMemoryVectorStore`, 并在 embedding provider fingerprint 和 content hash 匹配时复用已持久化的文档向量.
- `VECTOR_STORE=chroma` 使用 Chroma HTTP API 检索知识库; Chroma 不可用时会回退到本地向量检索.

## Embedding 配置

- `EMBEDDING_PROVIDER=local` 使用确定性的本地 hashing vector, 不需要网络.
- `EMBEDDING_PROVIDER=openai-compatible` 会调用 `${EMBEDDING_API_BASE_URL}/embeddings`.
- `EMBEDDING_MODEL` 用于选择 OpenAI-compatible embedding model.
- `EMBEDDING_API_KEY` 对本地 OpenAI-compatible 服务可选; 使用 `api.openai.com` 时必填.
- `EMBEDDING_DIMENSIONS` 控制本地 hashing vector 维度.

## Chroma 配置

- `VECTOR_STORE=chroma` 开启 Chroma 知识库检索和 reindex upsert.
- `CHROMA_BASE_URL` 默认是 `http://127.0.0.1:8000`.
- `CHROMA_TENANT`, `CHROMA_DATABASE`, `CHROMA_COLLECTION` 用于选择 Chroma namespace.
- `CHROMA_TOKEN` 不为空时会以 `x-chroma-token` 发送.
- 启用 Chroma 后执行 `npm run reindex`, 以创建并填充 collection.
