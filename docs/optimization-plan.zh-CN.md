# 优化执行方案

本文从真实用户使用路径出发, 把改进拆成可执行阶段. 本轮已完成第一阶段中风险较低、能直接提升体验和可观测性的改动.

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

## 后续路线

### 第一阶段: 轻量个人工作台

目标: 不引入数据库和登录, 先提升单用户体验.

操作步骤:

1. 增加提问历史, 保存在 `localStorage`.
2. 支持收藏优秀回答, 可按 persona 和主题过滤.
3. 增加一键复制文言回答、白话解释和引用来源.
4. 增加导出 Markdown / JSON.
5. 增加前端表单校验提示, 包括超长输入、空偏好和 provider 未配置.

验收标准:

- 刷新页面后仍能看到最近 20 条历史.
- 用户能在 2 次点击内复用历史问题重新生成.
- 单测覆盖历史序列化和导出格式.

### 第二阶段: 服务端用户与权限

目标: 支持多用户、跨设备同步和管理入口.

操作步骤:

1. 使用现有 `prisma/schema.prisma` 扩展 `User`, `UserPreference`, `GenerationSession`, `SavedAnswer`.
2. 增加登录方式: 首选 magic link 或本地开发 mock session.
3. 把当前 `userContext` 从 localStorage 迁移为服务端偏好, localStorage 只做匿名模式 fallback.
4. API 增加用户级速率限制和请求审计字段.
5. UI 增加用户菜单、偏好页、历史页和退出登录.

验收标准:

- 匿名用户仍可使用现有流程.
- 登录用户跨浏览器可同步偏好和收藏.
- 所有生成请求能追踪到匿名 session 或 user id.

### 第三阶段: 可维护 RAG 知识库

目标: 从样例内存检索升级为可扩展知识库.

操作步骤:

1. 规范 `KnowledgeRecord` metadata: `category`, `source`, `license`, `era`, `credibility`, `updatedAt`.
2. 为 `scripts/ingest-knowledge.ts` 增加 raw 文件读取、清洗、切分和校验.
3. 接入 embedding provider 抽象, 支持本地 embedding 和 OpenAI-compatible embedding.
4. 在 `lib/infra/vector/` 增加外部向量库适配器, 如 Qdrant、pgvector 或 Chroma.
5. 增加管理 API: 上传文档、重建索引、查看 chunk、禁用低质量来源.

验收标准:

- 能从 raw corpus 重建 processed corpus 和 vector index.
- 查询结果包含来源、chunk id、分数和许可信息.
- 生成结果只引用实际召回片段, 不出现伪来源.

### 第四阶段: AI 质量评估与模型策略

目标: 把“好不好”从主观体验变成可回归指标.

操作步骤:

1. 建立固定评测集, 覆盖学习、处世、情绪、规划和文言输入.
2. 增加自动评分维度: 贴题度、文言自然度、解释清晰度、引用一致性.
3. 为 provider profile 增加策略字段: 默认 temperature、最大 token、超时、fallback provider.
4. 保存每次生成的 prompt 摘要、provider、耗时、失败原因和命中来源.
5. 增加回归测试脚本, 在上线前比较新旧模型输出质量.

验收标准:

- 每个模型 profile 都有可重复的质量报告.
- provider 失败时有清晰 fallback 和错误提示.
- RAG 相关回答能通过引用一致性检查.

### 第五阶段: 协作与运营

目标: 支持团队维护知识库和风格角色.

操作步骤:

1. 增加 admin 角色和内容审核状态.
2. 增加 persona 管理页, 可新增角色、来源、风格摘要和示例.
3. 增加知识库版本管理, 支持回滚到旧索引.
4. 增加团队共享 prompt 模板和输出规范.
5. 增加使用统计看板, 观察常见问题、失败原因和热门 persona.

验收标准:

- 管理员可在 UI 中完成知识库更新和 reindex.
- 普通用户只能读共享知识库, 不能改 corpus.
- 每次知识库发布都能追踪版本、作者和变更摘要.
