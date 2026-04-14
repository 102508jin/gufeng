# &#x53E4;&#x98CE;&#x95EE;&#x7B54;

[English README](./README.md)

&#x53E4;&#x98CE;&#x95EE;&#x7B54; &#x662F;&#x4E00;&#x4E2A; Next.js &#x9879;&#x76EE;, &#x7528;&#x4E8E; &#x628A; &#x767D;&#x8BDD;&#x6587; &#x6216; &#x6587;&#x8A00;&#x6587; &#x95EE;&#x9898; &#x8F6C;&#x6210; &#x591A;&#x7248; &#x6587;&#x8A00; &#x7B54;&#x590D; &#x4E0E; &#x89E3;&#x6790;.

## &#x9879;&#x76EE;&#x6982;&#x89C8;

- &#x652F;&#x6301; &#x767D;&#x8BDD;&#x6587; / &#x6587;&#x8A00;&#x6587; &#x8F93;&#x5165;
- &#x5148;&#x505A; &#x95EE;&#x9898; &#x5F52;&#x4E00;&#x5316;
- &#x518D; &#x751F;&#x6210; &#x591A;&#x7248; &#x6587;&#x8A00; &#x56DE;&#x7B54;
- &#x9644;&#x5E26; &#x9010;&#x53E5; &#x89E3;&#x6790;, &#x610F;&#x8BD1; &#x9610;&#x91CA;, &#x8BCD;&#x4E49; &#x6CE8;&#x91CA;
- &#x53EF;&#x5207;&#x6362; `mock`, `ollama`, `openai` provider

## &#x5FEB;&#x901F;&#x5F00;&#x59CB;

1. &#x5B89;&#x88C5; &#x4F9D;&#x8D56;

```powershell
cmd /c npm install
```

2. &#x590D;&#x5236; `.env`

```powershell
Copy-Item .env.example .env
```

3. &#x9009;&#x62E9; provider

```env
MODEL_PROVIDER=mock
```

```env
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
MODEL_NAME=qwen3:4b
```

4. &#x5982;&#x679C; &#x4F7F;&#x7528; Ollama, &#x5148; &#x542F;&#x52A8; &#x670D;&#x52A1; &#x5E76; &#x51C6;&#x5907; &#x6A21;&#x578B;

```powershell
ollama serve
ollama pull qwen3:4b
```

5. &#x542F;&#x52A8; &#x5F00;&#x53D1; &#x670D;&#x52A1;

```powershell
cmd /c npm run dev
```

6. &#x6253;&#x5F00; `http://localhost:3000`

## Windows / PowerShell &#x8BF4;&#x660E;

&#x5982;&#x679C; PowerShell &#x963B;&#x6B62; `npm.ps1`, &#x8BF7; &#x4F7F;&#x7528; `cmd /c npm ...`.

```powershell
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
```

## &#x6587;&#x6863;&#x7D22;&#x5F15;

- [&#x8D21;&#x732E;&#x6307;&#x5357;](./CONTRIBUTING.zh-CN.md)
- [&#x67B6;&#x6784;&#x8BF4;&#x660E;](./docs/architecture.zh-CN.md)
- [API &#x8BF4;&#x660E;](./docs/api.zh-CN.md)
- [&#x6570;&#x636E;&#x5BFC;&#x5165; &#x8BF4;&#x660E;](./docs/data-ingestion.zh-CN.md)
- [License &#x4E2D;&#x6587; &#x8BF4;&#x660E;](./LICENSE.zh-CN.md)

## &#x5206;&#x652F; &#x8BF4;&#x660E;

- `dev` : &#x65E5;&#x5E38; &#x5F00;&#x53D1; &#x5206;&#x652F;
- `main` : &#x7A33;&#x5B9A; &#x53D1;&#x5E03; &#x5206;&#x652F;
