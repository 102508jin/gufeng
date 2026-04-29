# 优化执行方案

本文从真实用户使用路径出发, 把改进拆成可执行阶段. 当前部署目标是纯本地运行, 因此用户体系不做登录和远端同步, 改为本机多配置档、本地备份和离线可迁移.

## 用户视角问题

1. 首屏更像演示页, 不够像可反复使用的工作台.
2. 用户偏好无法保存, 每次生成都要重新描述用途、风格和解释偏好.
3. AI 参与程度不可控, 用户无法选择更稳妥或更有文采的生成策略.
4. RAG 知识库只在结果里展示, 生成前不能验证召回是否相关.
5. 用户管理、知识库管理和模型策略缺少逐步生产化路线.

## 本轮已完成

1. UI 工作台优化
   - 全局样式改为低圆角、双栏工作台布局.
   - 增强移动端单栏布局、输入区 sticky 行为和结果区扫读能力.
   - 增加知识库预检结果、RAG 分数、AI 介入和检索模式摘要.

2. 本地用户管理
   - 新增本地用户画像: `displayName`, `useCase`, `preference`.
   - 浏览器端用 `localStorage` 保存, 不引入服务端账号依赖.
   - 每次生成时通过 `userContext` 进入服务层和 prompt.

3. AI 介入机制
   - 新增 `aiIntervention`: `conservative`, `balanced`, `creative`.
   - 生成 prompt 会根据介入强度调整约束.
   - 非 mock provider 会按介入强度调整 temperature.
   - mock fallback 会在风格说明中展示介入强度.

4. RAG 知识库机制
   - 新增 `retrievalMode`: `off`, `focused`, `auto`, `broad`.
   - 分别对应知识库召回 0、2、4、6 条.
   - 新增 `GET /api/knowledge/search`, 支持生成前检索预览.
   - 保持 `SourceRetriever` 抽象, 后续可替换为外部向量库.

5. 测试与文档
   - 增加知识库服务单测.
   - 增加生成服务对用户画像、AI 介入和关闭 RAG 的覆盖.
   - 同步 README、API、架构和数据导入文档.

6. 轻量个人工作台
   - 增加最近 20 条提问历史, 保存在浏览器 `localStorage`.
   - 支持从历史一键复用问题和生成设置.
   - 支持收藏回答, 并按角色和主题关键词过滤.
   - 支持复制文言、解释和来源.
   - 支持当前结果导出 Markdown / JSON, 收藏回答导出 Markdown.
   - 增加前端表单提示, 包括短输入、长输入、空偏好和 provider 配置状态.

7. 开发端口自适应
   - `npm run dev` 由 `scripts/dev-server.ts` 接管.
   - 支持从 `PORT` 或 `--port` 指定起始端口.
   - 起始端口被占用时自动递增探测并启动 Next.js.

8. 纯本地多配置档
   - 不引入登录、账号系统或远端服务.
   - 支持多个本地配置档, 每个配置档独立保存用户偏好、历史和收藏.
   - 支持切换、新建、重命名、删除本地配置档.
   - 支持配置档 JSON 备份导出和导入, 方便在本机或离线环境迁移.
   - 首次升级会把旧版 `localStorage` 中的偏好、历史和收藏迁移到默认配置档.

9. 知识库导入与用户反馈
   - 增加工作台知识库导入 UI, 支持粘贴文本和导入 TXT / JSON.
   - 新增 `POST /api/knowledge/import`, 导入后自动重建 processed corpus 和 vector index.
   - 增加回答反馈按钮: 有用、不准、太长、太文.
   - 反馈按本地配置档保存, 并随配置档备份导出 / 导入.

## 后续路线

### 第一阶段: 轻量个人工作台

目标: 不引入数据库和登录, 先提升单用户体验.

状态: 已完成.

操作步骤:

1. 已增加提问历史, 保存在 `localStorage`.
2. 已支持收藏优秀回答, 可按 persona 和主题过滤.
3. 已增加一键复制文言回答、白话解释和引用来源.
4. 已增加导出 Markdown / JSON.
5. 已增加前端表单提示, 包括超长输入、空偏好和 provider 未配置.

验收标准:

- 刷新页面后仍能看到最近 20 条历史. 已完成.
- 用户能在 2 次点击内复用历史问题重新生成. 已完成.
- 单测覆盖历史序列化和导出格式. 已完成.

### 第二阶段: 纯本地配置档与离线迁移

目标: 在不连接外部服务器、不做登录的前提下, 支持本机多用户/多场景使用和离线迁移.

状态: 已完成.

操作步骤:

1. 已取消登录设计, 改为浏览器本地配置档.
2. 已增加配置档切换、新建、重命名和删除.
3. 已按配置档隔离 `userContext`, 历史记录和收藏回答.
4. 已增加配置档备份导出和 JSON 导入.
5. 已保留旧版本地数据迁移逻辑, 首次打开会生成默认配置档.

验收标准:

- 不配置数据库、不登录也能完整使用. 已完成.
- 不同配置档之间历史和收藏互不干扰. 已完成.
- 配置档可通过 JSON 文件离线备份和恢复. 已完成.

### 第三阶段: 可维护 RAG 知识库

目标: 从样例内存检索升级为可扩展知识库.

状态: 基础切片已完成, 外部 embedding / vector store 待接入.

当前进展:

- 已规范 `KnowledgeRecord` 的 source、license、era、credibility、updatedAt、documentId 和 chunkId.
- 已增加 `data/raw/knowledge/` raw JSON 示例语料.
- 已将 `scripts/ingest-knowledge.ts` 改为 raw -> processed 的校验、清洗和切分管线.
- 检索和生成引用会透出 source、license、chunk id 和 score.
- 已增加 embedding provider 抽象, 默认本地 hashing embedding, 可切换 OpenAI-compatible `/embeddings` 接口.
- 已增加本地向量索引持久化, `reindex` 会生成 `data/processed/vector-index.json`, 检索时按 provider fingerprint 和 content hash 安全复用.

操作步骤:

1. 已规范 `KnowledgeRecord` metadata: `category`, `source`, `license`, `era`, `credibility`, `updatedAt`.
2. 已为 `scripts/ingest-knowledge.ts` 增加 raw 文件读取、清洗、切分和校验.
3. 已接入 embedding provider 抽象, 支持本地 embedding 和 OpenAI-compatible embedding.
4. 已在 `lib/infra/vector/` 增加本地向量索引持久化; 外部向量库适配器如 Qdrant、pgvector 或 Chroma 待接入.
5. 增加管理 API: 上传文档、重建索引、查看 chunk、禁用低质量来源.

验收标准:

- 能从 raw corpus 重建 processed corpus 和 vector index.
- 查询结果包含来源、chunk id、分数和许可信息.
- 生成结果只引用实际召回片段, 不出现伪来源.

### 第四阶段: AI 质量评估与模型策略

目标: 把“好不好”从主观体验变成可回归指标.

状态: 基础评估与部署门禁已完成, 多真实模型对比报告待扩展.

当前进展:

- 已增加固定评测集 `data/evals/generation-cases.json`, 覆盖学习、规划、人生选择和解释需求.
- 已增加 `npm run eval:quality`, 校验变体数量、文言输出、解释完整性、引用一致性和主题覆盖.
- 已增加 `npm run verify`, 串联 ingestion、reindex、test、quality eval 和 build.
- 已增强 `/api/health`, 返回 corpus、model profile、embedding provider 和 vector index 新鲜度.
- 已增加外部模型失败时的 mock fallback, 并在 debug 中返回 primary/fallback provider 和失败原因.
- 已增加部署检查文档和 Dockerfile, 支持本地默认离线部署.

操作步骤:

1. 已建立固定评测集, 覆盖学习、处世、规划和文言输入.
2. 已增加自动评分维度: 贴题度、文言自然度、解释清晰度、引用一致性.
3. 已具备 provider timeout 和失败 fallback; provider profile 默认 temperature、最大 token 等细粒度策略待扩展.
4. 保存每次生成的 prompt 摘要、provider、耗时、失败原因和命中来源.
5. 增加回归测试脚本, 在上线前比较新旧模型输出质量.

验收标准:

- mock profile 已有可重复的质量报告; 多真实模型 profile 报告待扩展.
- provider 失败时有清晰 fallback 和错误提示. 已完成基础覆盖.
- RAG 相关回答能通过引用一致性检查. 已完成基础覆盖.

### 第五阶段: 协作与运营

目标: 支持团队维护知识库和风格角色.

操作步骤:

1. 增加 admin 角色和内容审核状态.
2. 增加 persona 管理页, 可新增角色、来源、风格摘要和示例.
3. 增加知识库版本管理, 支持回滚到旧索引.
4. 增加团队共享 prompt 模板和输出规范.
5. 增加使用统计看板, 观察常见问题、失败原因和热门 persona.
6. 将本地反馈聚合为仅本机可见的质量改进看板.

验收标准:

- 管理员可在 UI 中完成知识库更新和 reindex.
- 普通用户只能读共享知识库, 不能改 corpus.
- 每次知识库发布都能追踪版本、作者和变更摘要.
