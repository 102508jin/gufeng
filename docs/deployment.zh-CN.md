# 部署检查清单

[English version](./deployment.md)

本项目按本地优先部署设计. 默认 `mock` 模型和本地 hashing embedding 不依赖外部服务, 因此可以先完成离线验证, 再配置真实 API 或本地模型.

## 本地部署步骤

1. 安装依赖.

```powershell
npm install
```

2. 创建本地环境变量文件.

```powershell
Copy-Item .env.example .env.local
```

3. 在 `.env.local` 中配置模型 provider.

- 离线验证时保持 `DEFAULT_PROVIDER_ID=mock`.
- 只有在本地服务或 API key 已就绪时, 才切换到 `ollama`, `openai` 或 `anthropic`.
- 除非已有 OpenAI-compatible `/embeddings` endpoint, 否则保持 `EMBEDDING_PROVIDER=local`.

4. 重建语料和向量索引.

```powershell
npm run ingest:knowledge
npm run reindex
```

5. 运行完整部署检查.

```powershell
npm run verify
```

6. 启动生产模式.

```powershell
npm run start
```

7. 检查运行状态.

```text
GET /api/health
```

返回结果应为 `status: "ok"`. 如果是 `degraded`, 说明 corpus、模型配置、embedding provider 或 vector index 需要处理后再发布.

## Docker 部署

构建镜像:

```powershell
docker build -t wenyan-agent .
```

使用离线默认配置运行:

```powershell
docker run --rm -p 3000:3000 wenyan-agent
```

如需使用真实 provider, 通过环境变量传入配置:

```powershell
docker run --rm -p 3000:3000 `
  -e DEFAULT_PROVIDER_ID=openai `
  -e OPENAI_API_KEY=... `
  -e OPENAI_API_BASE_URL=https://api.openai.com/v1 `
  wenyan-agent
```

镜像构建时会重建 processed corpus 和本地 vector index. 修改 `data/raw/knowledge/` 后需要重新构建镜像.

## 发布前门禁

- `npm run ingest:knowledge` 成功.
- `npm run reindex` 生成 `data/processed/vector-index.json`.
- `npm test` 通过.
- `npm run eval:quality` 固定评测集全部通过.
- `npm run build` 通过.
- `GET /api/health` 返回 `ok`.
- 如果需要容器部署, Docker image 能成功构建.

## 隐私与密钥

- 不提交 `.env`, `.env.local`, API key, token, cookie 或用户私有备份.
- `MODEL_PROFILES_JSON` 使用 `apiKeyEnv` 引用密钥, 不写内联 key.
- 测试使用合成评测集和 sample corpus, 不使用真实用户输入或私有语料.
- 本地配置档数据继续保存在浏览器 `localStorage`; 除非产品方向改变, 不增加远端同步.

## 回滚方式

- 将 provider 配置恢复为 `DEFAULT_PROVIDER_ID=mock` 和 `EMBEDDING_PROVIDER=local`, 可恢复离线运行.
- 修改 corpus 或 embedding 配置后, 重新执行 `npm run ingest:knowledge` 和 `npm run reindex`.
- 如果 health 显示 vector index stale, 删除并通过 `npm run reindex` 重建 `data/processed/vector-index.json`.
