# &#x67B6;&#x6784; &#x8BF4;&#x660E;

[English version](./architecture.md)

&#x9879;&#x76EE; &#x76EE;&#x524D; &#x91C7;&#x7528; &#x4E94;&#x5C42; &#x7ED3;&#x6784;:

- `app/` &#x4E0E; `components/` : &#x8D1F;&#x8D23; UI, &#x9875;&#x9762; &#x7EC4;&#x88C5; &#x548C; route wiring
- `lib/services/` : &#x8D1F;&#x8D23; &#x5B8C;&#x6574; &#x4E1A;&#x52A1; &#x7F16;&#x6392;
- `lib/domain/` : &#x8D1F;&#x8D23; &#x5F52;&#x4E00;&#x5316;, &#x751F;&#x6210;, &#x89E3;&#x91CA;, &#x68C0;&#x7D22; &#x7B49; &#x6838;&#x5FC3; &#x80FD;&#x529B;
- `lib/infra/` : &#x9694;&#x79BB; provider, repository, logging, index adapter &#x7B49; &#x5916;&#x90E8; &#x4F9D;&#x8D56;
- `data/processed/` : &#x5B58;&#x653E; &#x672C;&#x5730; RAG &#x79CD;&#x5B50; &#x8BED;&#x6599;

&#x9ED8;&#x8BA4; runtime &#x4F7F;&#x7528; `mock` provider, &#x56E0;&#x6B64; &#x5728; API key &#x6216; &#x672C;&#x5730; model &#x672A;&#x914D;&#x7F6E; &#x65F6; &#x4E5F;&#x80FD; &#x8DD1;&#x901A; &#x5B8C;&#x6574; &#x6D41;&#x7A0B;. &#x5207;&#x6362; &#x5230; OpenAI-compatible &#x6216; Ollama &#x65F6;, &#x4E3B;&#x8981; &#x53EA;&#x9700; &#x8C03;&#x6574; env &#x548C; provider &#x5C42;.

## 当前用户链路

1. `components/workspace.tsx` 维护问题、角色、provider、本地用户画像、AI 介入强度和 RAG 检索深度.
2. 本地用户画像、最近提问历史和收藏回答只保存在浏览器 `localStorage`, 不进入服务端持久化; 请求时用户画像作为 `userContext` 发送给 `/api/generate`.
3. `/api/generate` 使用 `generateRequestSchema` 校验请求, 再交给 `GenerateService`.
4. `GenerateService` 完成 provider 解析、输入归一化、persona 检索、知识库检索和生成/解释编排.
5. `GenerationContext` 会携带 `aiIntervention`, `retrievalMode`, `userContext`, 由 prompt builder 和 generator 使用.
6. `/api/knowledge/search` 复用 `KnowledgeService` 和 `LocalSourceRetriever`, 用于生成前预检知识库命中.

## 本地工作台记忆

- `lib/utils/workspace-memory.ts` 负责历史、收藏、导出和序列化校验.
- 历史记录最多保留 20 条, 包含问题、生成设置、角色、provider、主题和归一化问题.
- 收藏回答保存文言正文、解释、来源和主题, UI 支持按角色与主题过滤.
- 当前结果可导出 Markdown / JSON, 单条收藏可导出 Markdown.
- 这些能力是匿名本地模式; 后续服务端用户体系可在不改变 UI 使用路径的前提下替换持久化层.

## 开发服务端口

- `npm run dev` 会执行 `scripts/dev-server.ts`.
- 脚本从 `PORT` 或 `--port` 读取起始端口, 默认 3000.
- 若端口被占用, 会继续探测后续端口并把可用端口传给 `next dev --port`.

## RAG 与 AI 介入

- `retrievalMode=off` 时不召回知识库片段, 但仍可使用已选 persona 的风格片段.
- `focused`, `auto`, `broad` 分别召回 2、4、6 条知识库片段.
- `aiIntervention=conservative` 会降低模型温度并要求更贴近问题与来源.
- `aiIntervention=creative` 会提高生成温度, 但仍要求不可伪造引用.
- mock provider 走确定性 fallback, 仍会在 style notes 中反映介入强度.
