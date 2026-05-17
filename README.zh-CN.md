# &#x53E4;&#x98CE;&#x95EE;&#x7B54;

[English README](./README.md)

&#x53E4;&#x98CE;&#x95EE;&#x7B54; &#x662F;&#x4E00;&#x4E2A; Next.js &#x9879;&#x76EE;, &#x7528;&#x4E8E; &#x628A; &#x767D;&#x8BDD;&#x6587; &#x6216; &#x6587;&#x8A00;&#x6587; &#x95EE;&#x9898; &#x8F6C;&#x6210; &#x591A;&#x7248; &#x6587;&#x8A00; &#x7B54;&#x590D; &#x4E0E; &#x89E3;&#x6790;.

## &#x9879;&#x76EE;&#x6982;&#x89C8;

- &#x652F;&#x6301; &#x767D;&#x8BDD;&#x6587; / &#x6587;&#x8A00;&#x6587; &#x8F93;&#x5165;
- &#x5148;&#x505A; &#x95EE;&#x9898; &#x5F52;&#x4E00;&#x5316;
- &#x518D; &#x751F;&#x6210; &#x591A;&#x7248; &#x6587;&#x8A00; &#x56DE;&#x7B54;
- &#x9644;&#x5E26; &#x9010;&#x53E5; &#x89E3;&#x6790;, &#x610F;&#x8BD1; &#x9610;&#x91CA;, &#x8BCD;&#x4E49; &#x6CE8;&#x91CA;
- &#x53EF;&#x5207;&#x6362; `mock`, `ollama`, `openai-compatible`, `anthropic` provider
- &#x652F;&#x6301; &#x5728; UI &#x548C; API &#x4E2D; &#x6309; &#x8BF7;&#x6C42; &#x9009;&#x62E9; &#x6A21;&#x578B;&#x9A71;&#x52A8;
- 支持浏览器本地接口覆盖、最大输出 token 预算调节和连接测试
- 支持本地用户画像偏好, 自动保存到浏览器 `localStorage`
- 支持 AI 介入强度: 稳妥 / 平衡 / 创作
- 支持 RAG 知识库检索深度: 关闭 / 精准 / 标准 / 广搜
- 支持在生成前通过 UI 或 `GET /api/knowledge/search` 预检知识库命中来源
- 支持本地历史、收藏、复制和 Markdown / JSON 导出
- 支持纯本地多配置档, 各配置档独立保存偏好、历史和收藏
- 支持配置档 JSON 备份导出 / 导入, 便于离线迁移
- 支持工作台导入本地 TXT / JSON 知识库文档
- 支持对单条回答做本地反馈: 有用、不准、太长、太文
- `npm run dev` 会自动探测空闲端口, 不再固定占用 3000

## 当前状态

- 前端栈: Next.js 15 + React 19 + TypeScript
- 校验: Zod
- 本地检索: `data/` 下的文件型种子语料
- 向量检索: 默认离线本地向量索引, 可选 Chroma HTTP store, Chroma 不可用时回退本地检索
- provider 可靠性: 外部模型失败时回退到确定性的 `mock` 输出, 并在 debug 中给出 fallback 信息
- 分支流程: `dev` 日常开发, `main` 稳定推广

## &#x5FEB;&#x901F;&#x5F00;&#x59CB;

1. &#x5B89;&#x88C5; &#x4F9D;&#x8D56;

```powershell
cmd /c npm install
```

2. &#x590D;&#x5236; `.env.local`

```powershell
Copy-Item .env.example .env.local
```

3. &#x5728; `.env.local` &#x4E2D; &#x8BBE;&#x5B9A; &#x9ED8;&#x8BA4; provider

```env
MODEL_PROVIDER=mock
DEFAULT_PROVIDER_ID=mock
```

```env
MODEL_PROVIDER=ollama
DEFAULT_PROVIDER_ID=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
MODEL_NAME=qwen3:4b
```

```env
MODEL_PROVIDER=openai
DEFAULT_PROVIDER_ID=openai
OPENAI_API_KEY=your_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4.1-mini
```

```env
MODEL_PROVIDER=anthropic
DEFAULT_PROVIDER_ID=anthropic
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

## Provider Profiles

`DEFAULT_PROVIDER_ID` &#x7528;&#x4E8E; &#x6307;&#x5B9A; &#x9ED8;&#x8BA4; &#x6A21;&#x578B;&#x914D;&#x7F6E;.

`MODEL_PROFILES_JSON` &#x53EF;&#x4EE5; &#x8865;&#x5145; &#x989D;&#x5916; &#x7684; &#x53EF;&#x5207;&#x6362; provider, &#x4F8B;&#x5982; vLLM &#x6216; SGLang:

```env
MODEL_PROFILES_JSON=[{"id":"vllm","label":"vLLM","driver":"openai-compatible","baseUrl":"http://127.0.0.1:8000/v1","model":"Qwen/Qwen3-4B-Instruct"},{"id":"sglang","label":"SGLang","driver":"openai-compatible","baseUrl":"http://127.0.0.1:30000/v1","model":"Qwen/Qwen3-4B-Instruct"}]
DEFAULT_PROVIDER_ID=vllm
```

自定义 profile 的密钥请使用 `apiKeyEnv` 引用环境变量; `MODEL_PROFILES_JSON` 中的内联 `apiKey` 会被忽略. Profile 可设置 `maxCompletionTokens`, 浏览器端模型设置页也可以按请求覆盖该 token 预算.

请求级 provider 覆盖支持 `openaiBaseUrl`, `anthropicBaseUrl`, `maxCompletionTokens`. OpenAI-compatible 会收到 `max_completion_tokens`, Anthropic 会收到 `max_tokens`, Ollama 会收到 `num_predict`.

## Embedding 配置

默认 `EMBEDDING_PROVIDER=local`, 使用离线确定性的本地 hashing embedding, 不需要外部服务.

如需使用 OpenAI-compatible embedding endpoint:

```env
EMBEDDING_PROVIDER=openai-compatible
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_api_key
```

本地兼容服务可省略 `EMBEDDING_API_KEY`; 使用 `api.openai.com` 时必须配置 key.

## 向量存储配置

默认 `VECTOR_STORE=local`, 使用 `data/processed/vector-index.json` 和本地内存检索.

如需使用 Chroma:

```env
VECTOR_STORE=chroma
CHROMA_BASE_URL=http://127.0.0.1:8000
CHROMA_TENANT=default_tenant
CHROMA_DATABASE=default_database
CHROMA_COLLECTION=wenyan_knowledge
CHROMA_TOKEN=
```

切换 Chroma 后需执行 `npm run reindex`, 以创建/更新 collection; 本地 vector index 仍会写入作为 fallback.

4. &#x5982;&#x679C; &#x4F7F;&#x7528; Ollama, &#x5148; &#x542F;&#x52A8; &#x670D;&#x52A1; &#x5E76; &#x51C6;&#x5907; &#x6A21;&#x578B;

```powershell
ollama serve
ollama pull qwen3:4b
```

5. &#x542F;&#x52A8; &#x5F00;&#x53D1; &#x670D;&#x52A1;

```powershell
cmd /c npm run dev
```

启动脚本会优先尝试 `PORT` 或 `--port` 指定的端口, 如果已被占用会自动递增选择空闲端口.

```powershell
cmd /c npm run dev -- --port 3000
```

6. 按终端输出打开本地地址, 例如 `http://localhost:3000` 或自动选择的其他端口.

## Windows / PowerShell &#x8BF4;&#x660E;

&#x5982;&#x679C; PowerShell &#x963B;&#x6B62; `npm.ps1`, &#x8BF7; &#x4F7F;&#x7528; `cmd /c npm ...`.

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
cmd /c npm run test
cmd /c npm run eval:quality
cmd /c npm run verify
```

## 环境变量索引

- `MODEL_PROVIDER`, `DEFAULT_PROVIDER_ID`, `MODEL_PROFILES_JSON`
- `MODEL_NAME`, `OPENAI_API_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_PROVIDER_LABEL`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_PROVIDER_LABEL`
- `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_PROVIDER_LABEL`
- `DEFAULT_VARIANTS_COUNT`, `DEFAULT_EXPLANATION_MODES`, `MODEL_REQUEST_TIMEOUT_MS`
- `EMBEDDING_PROVIDER`, `EMBEDDING_PROVIDER_LABEL`, `EMBEDDING_MODEL`, `EMBEDDING_API_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_DIMENSIONS`
- `VECTOR_STORE`, `CHROMA_BASE_URL`, `CHROMA_TENANT`, `CHROMA_DATABASE`, `CHROMA_COLLECTION`, `CHROMA_TOKEN`

## Driver 说明

- `GET /api/providers` 返回前端可切换的模型 profile 列表.
- `POST /api/providers/test` 测试当前模型连接, 响应不包含密钥.
- `mock` provider 不需要外部连接, 可用于离线验证.
- 外部 provider 生成失败时, 服务会回退到 `mock`, 并在 `debug` 中返回 `primaryProviderId`, `fallbackProviderId`, `fallbackReason`.

## &#x6587;&#x6863;&#x7D22;&#x5F15;

- [&#x8D21;&#x732E;&#x6307;&#x5357;](./CONTRIBUTING.zh-CN.md)
- [&#x67B6;&#x6784;&#x8BF4;&#x660E;](./docs/architecture.zh-CN.md)
- [API &#x8BF4;&#x660E;](./docs/api.zh-CN.md)
- [&#x6570;&#x636E;&#x5BFC;&#x5165; &#x8BF4;&#x660E;](./docs/data-ingestion.zh-CN.md)
- [部署检查清单](./docs/deployment.zh-CN.md)
- [优化执行方案](./docs/optimization-plan.zh-CN.md)
- [License &#x4E2D;&#x6587; &#x8BF4;&#x660E;](./LICENSE.zh-CN.md)

## &#x5206;&#x652F; &#x8BF4;&#x660E;

- `dev` : &#x65E5;&#x5E38; &#x5F00;&#x53D1; &#x5206;&#x652F;
- `main` : &#x7A33;&#x5B9A; &#x53D1;&#x5E03; &#x5206;&#x652F;
