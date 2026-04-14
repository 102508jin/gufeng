# 古风问答

[English README](./README.md)

古风问答是一个基于 Next.js 的文言文回答智能体项目。它接收白话文或文言文输入，先将问题整理为现代汉语语义中间稿，再生成多版文言答复，并附带白话解析、逐句对应说明、词义注释，以及基于历史人物语料的角色化输出。

## 项目能力

- 支持白话文输入与文言文输入
- 先做问题归一化，再进入文言生成流程
- 输出多个文言答复版本
- 支持逐句直解、意译阐释、词义注释
- 支持基于本地人物语料的人设风格输出
- 支持 `mock`、本地 `Ollama`、OpenAI 兼容接口三种模型来源
- 当前界面文案与主要用户可见输出均已中文化

## 当前技术状态

- 前端框架：Next.js 15 + React 19 + TypeScript
- 参数校验：Zod
- 检索方式：本地文件语料 + 轻量检索
- 本地模型：已验证可接入 Ollama
- 已测试模型：`qwen3:4b`
- 分支策略：`dev` 为日常开发分支，`main` 为稳定分支

## 快速开始

1. 安装依赖。

```powershell
cmd /c npm install
```

2. 复制环境变量模板。

```powershell
Copy-Item .env.example .env
```

3. 按你的运行方式配置 `.env`。

仅演示流程：

```env
MODEL_PROVIDER=mock
```

本地 Ollama：

```env
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
MODEL_NAME=qwen3:4b
```

OpenAI 兼容接口：

```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=你的密钥
OPENAI_API_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4.1-mini
```

4. 如果使用 Ollama，先启动服务并准备模型。

```powershell
ollama serve
ollama pull qwen3:4b
```

5. 启动开发服务。

```powershell
cmd /c npm run dev
```

6. 浏览器访问：

```text
http://localhost:3000
```

## Windows / PowerShell 说明

如果 PowerShell 因执行策略阻止 `npm.ps1`，请统一改用 `cmd /c npm ...`。例如：

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
```

这是当前仓库在 Windows 上最稳定的调用方式。

## 常用脚本

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
cmd /c npm run test
cmd /c npm run ingest:personas
cmd /c npm run ingest:knowledge
cmd /c npm run reindex
```

## 环境变量说明

- `MODEL_PROVIDER`：模型来源，可选 `mock`、`ollama`、`openai`
- `MODEL_NAME`：API 模型名或统一配置名
- `OPENAI_API_BASE_URL`：OpenAI 兼容接口地址
- `OPENAI_API_KEY`：OpenAI 兼容接口密钥
- `OLLAMA_BASE_URL`：本地 Ollama 服务地址
- `OLLAMA_MODEL`：本地模型名
- `DATABASE_URL`：后续持久化使用
- `DEFAULT_VARIANTS_COUNT`：默认生成版本数
- `DEFAULT_EXPLANATION_MODES`：默认解析类型，使用逗号分隔

## 目录结构

- `app/`：页面入口与 API 路由
- `components/`：前端组件
- `lib/domain/`：问题归一化、文言生成、解释生成、检索等核心能力
- `lib/services/`：业务编排层
- `lib/infra/`：模型提供方、仓储、基础设施适配层
- `data/`：人物与知识库语料
- `docs/`：架构、API、数据处理说明
- `scripts/`：语料导入和索引脚本
- `tests/`：测试文件

## 推荐开发顺序

1. 先稳定 `lib/types/`、`lib/domain/` 和 `lib/services/` 的输入输出结构。
2. 再替换模型层实现，例如从 `mock` 切到 `Ollama` 或 API。
3. 随后扩展人物语料、知识库与检索逻辑。
4. 最后再考虑数据库持久化、后台管理、部署和监控。

这样可以尽量保证框架基础不动，只替换内部能力实现。

## 相关文档

- [架构说明](./docs/architecture.md)
- [API 说明](./docs/api.md)
- [数据导入说明](./docs/data-ingestion.md)
- [协作规范](./CONTRIBUTING.md)

## 开发约定

- 日常开发以 `dev` 为主
- `main` 只接收稳定版本
- 尽量保持公共请求与响应结构稳定
- 优先在 `lib/domain/` 与 `lib/infra/` 扩展能力，不要把业务逻辑堆进路由处理器

## 备注

- 当前项目强调“外层框架先稳定、内部能力逐步替换”，适合先快速跑通，再逐步升级到更强的模型、RAG、数据库或部署方案。
- 如果你计划继续演进这个项目，优先补充人物语料质量、输出评估方式和检索质量，而不是过早重构页面结构。
