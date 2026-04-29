# AGENTS.md

本文件是面向 AI coding agent 的项目级运行规范。它补充 `README.md`、`CONTRIBUTING.md` 和 `docs/`，用于约束后续自动化修改、测试、权限使用和项目推进方式。

## 适用范围与优先级

- 本文件适用于仓库根目录下的全部文件。
- 若子目录未来新增更近的 `AGENTS.md` 或 `AGENTS.override.md`，更近文件对其目录树内文件优先。
- 用户在当前会话中的明确指令优先于本文件；系统、平台和工具安全规则优先于所有仓库文档。
- 遇到冲突时，选择更保守、更可逆、更少权限的方案，并在最终说明中指出冲突。

## 项目定位

- 项目是一个纯本地优先的文言回答工作台，基于 Next.js 15、React 19 和 TypeScript。
- 默认运行应可在 `mock` provider 下端到端工作，不强依赖外部 API。
- 用户体系坚持纯本地配置档：偏好、历史、收藏和备份优先保存在浏览器本地。
- RAG 知识库当前按 raw corpus -> processed chunks -> local vector index -> retrieval 的路线推进；默认本地 embedding，后续再接外部 vector store。

## 架构边界

- `app/`：Next.js 路由和 API route wiring，只放薄层请求处理。
- `components/`：UI 组件和交互状态，避免塞入领域规则。
- `lib/domain/`：输入归一化、prompt、persona、RAG 等核心领域逻辑。
- `lib/services/`：服务编排层，负责串联 provider、retriever、generator。
- `lib/infra/`：外部依赖适配层，包括 LLM provider、repository、logger、vector store。
- `lib/types/` 与 `lib/schemas/`：共享类型和请求校验。
- `data/raw/`：原始语料；`data/processed/`：脚本生成或规范化后的可检索数据。
- `scripts/`：导入、索引、开发启动等项目维护脚本。
- `tests/`：Vitest 测试。新增 utility 或 service orchestration 行为必须补测试。

## 修改范围规范

- 只修改完成当前任务所必需的文件；不要顺手重构无关模块。
- 优先修根因，避免通过硬编码、跳过校验或吞错来掩盖问题。
- 保持现有 public API、数据格式和本地存储迁移兼容；破坏性变更必须明确说明。
- 不新增生产依赖，除非任务明确需要；新增依赖前说明用途、替代方案和运行成本。
- 不移动、重命名或删除文件，除非任务要求或能证明这是最小正确方案。
- 不改动 `.env`、密钥、令牌、本地用户数据、浏览器导出的备份内容或真实语料，除非用户明确要求。
- 不提交 commit、不创建分支、不 push、不创建 PR，除非用户明确要求。

## 隐私与数据保护

- 默认把 `.env`、`.env.local`、API key、token、cookie、私有语料、用户备份和本地配置档视为敏感数据。
- 不在日志、测试快照、文档示例或最终回复中泄露真实密钥、完整路径中的敏感用户名、私有语料全文或用户个人信息。
- 读取敏感文件前必须确认确有必要；能通过 `.env.example`、schema 或 mock 数据判断时，不读取真实 `.env`。
- 示例配置只能使用占位值，例如 `OPENAI_API_KEY=...` 或 `sk-***`，不得生成看似真实的密钥。
- 不把本地数据上传到外部服务；不得为了调试而引入远端 telemetry、analytics 或自动同步。
- RAG 引用必须可追溯到实际召回 chunk，避免生成伪来源、伪书名、伪许可证或伪作者。

## 权限与命令执行

- 优先使用只读命令理解代码：`rg`、`Get-ChildItem`、`Get-Content`、`git diff`、`git status`。
- 写文件优先使用补丁式最小修改，避免批量脚本改写未知范围。
- 需要网络、安装依赖、访问系统目录、运行 GUI、删除/移动大量文件或执行潜在破坏性操作时，必须先获得用户确认。
- 不运行 `git reset --hard`、`git clean -fdx`、递归删除、批量格式化全仓库等高风险命令，除非用户明确要求且已说明影响。
- 不绕过 sandbox、审批、权限策略或分支保护；权限不足时停止并报告需要的权限。
- 长耗时命令应先说明目的；失败后先定位是否为环境问题，不盲目重复执行。

## 开发与验证命令

- 安装依赖：`npm install`
- 启动开发服务器：`npm run dev`
- 生产构建：`npm run build`
- 运行测试：`npm test`
- 导入 persona：`npm run ingest:personas`
- 导入知识库：`npm run ingest:knowledge`
- 重建索引状态：`npm run reindex`
- 固定质量评估：`npm run eval:quality`
- 部署前完整检查：`npm run verify`
- 代码改动后至少运行相关测试；服务、类型、数据管线或跨层改动完成后优先运行 `npm test`。
- 影响 Next.js 编译、路由、provider、schema 或 TypeScript 类型时，运行 `npm run build`。
- 如果验证命令因环境缺失失败，记录具体命令、错误摘要和用户可复现步骤，不伪造通过结果。

## RAG 与数据导入规范

- raw 知识文档放在 `data/raw/knowledge/`，processed chunks 由 `npm run ingest:knowledge` 生成。
- 本地向量索引放在 `data/processed/vector-index.json`，由 `npm run reindex` 生成。
- `KnowledgeRecord` 必须保留 `documentId`、`chunkId`、`chunkIndex`、`source`、`license`、`credibility`、`updatedAt` 等可追溯字段。
- 检索返回必须包含来源、许可、chunk id、分数和摘要，前端展示不得省略关键溯源信息。
- 修改 ingestion、retriever、vector store 或引用展示时，同步更新 `docs/data-ingestion.md`、`docs/data-ingestion.zh-CN.md` 和相关测试。
- 外部 vector store 适配应保持 `SourceRetriever` 和 `VectorStore` 抽象稳定；不要把具体厂商逻辑泄漏到 UI 或 route handler。

## Provider 与模型策略

- provider 相关逻辑应集中在 `lib/infra/llm/` 和 `lib/services/generate-service.ts` 的编排边界内。
- 不在代码中硬编码真实 base URL、密钥或私有模型凭据；使用环境变量或 `.env.example` 占位。
- `mock` provider 必须保持可用和确定性，确保未配置外部模型时仍可测试核心流程。
- 调整 temperature、token、timeout、fallback 行为时，同步测试和文档，避免隐藏模型失败原因。

## 测试规范

- 新增 utility 函数、数据管线、schema 校验、service 编排或 provider registry 行为时补 Vitest 单测。
- 测试应覆盖正常路径、边界输入和失败行为；不要只验证“有返回值”。
- 测试数据使用合成样例，不使用真实用户输入、真实密钥或私有语料。
- 不为了通过测试而降低断言质量、删除失败测试或扩大 mock 到掩盖真实行为。
- 如果发现无关测试失败，不擅自修复大范围无关问题；记录失败并说明与当前变更的关系。

## 文档与计划管理

- 行为、API、数据格式、环境变量或运行方式变化时，同步更新相关 README 或 `docs/`。
- `docs/optimization-plan.zh-CN.md` 是当前阶段推进依据；新增阶段性成果要更新状态和验收标准。
- 文档应说明真实限制，不写“已完成”除非代码、测试和构建已验证。
- 面向用户的中文文档优先保持清晰直接；英文文档保持与中文版本语义一致。

## Git 与审查

- 开发默认基于 `dev`，`main` 作为稳定推广分支。
- 提交前检查 `git status` 和 `git diff --check`，确认没有误改无关文件。
- PR 或交付说明应包含：改动摘要、验证命令、未完成事项、风险或兼容性说明。
- 不把生成产物、缓存、日志、密钥或本地环境文件加入版本控制，除非项目已有明确约定。

## 安全检查清单

- 是否引入了新的网络访问、文件写入、命令执行或外部依赖？
- 是否可能泄露用户输入、本地配置、API key、私有语料或 provider 信息？
- 是否保持纯本地优先和 mock fallback 可用？
- 是否有可回滚路径，且没有破坏旧 localStorage / profile backup 数据？
- 是否给新增行为补了测试，并运行了相关验证命令？
- 是否更新了文档和优化计划中的状态？

## 参考资料

- AGENTS.md open format: https://agents.md/
- OpenAI Codex AGENTS.md guide: https://developers.openai.com/codex/guides/agents-md
- GitHub Copilot repository custom instructions: https://docs.github.com/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- GitHub Copilot coding agent security and responsible use: https://docs.github.com/en/copilot/responsible-use/copilot-coding-agent
