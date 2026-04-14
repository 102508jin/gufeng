# &#x67B6;&#x6784; &#x8BF4;&#x660E;

[English version](./architecture.md)

&#x9879;&#x76EE; &#x76EE;&#x524D; &#x91C7;&#x7528; &#x4E94;&#x5C42; &#x7ED3;&#x6784;:

- `app/` &#x4E0E; `components/` : &#x8D1F;&#x8D23; UI, &#x9875;&#x9762; &#x7EC4;&#x88C5; &#x548C; route wiring
- `lib/services/` : &#x8D1F;&#x8D23; &#x5B8C;&#x6574; &#x4E1A;&#x52A1; &#x7F16;&#x6392;
- `lib/domain/` : &#x8D1F;&#x8D23; &#x5F52;&#x4E00;&#x5316;, &#x751F;&#x6210;, &#x89E3;&#x91CA;, &#x68C0;&#x7D22; &#x7B49; &#x6838;&#x5FC3; &#x80FD;&#x529B;
- `lib/infra/` : &#x9694;&#x79BB; provider, repository, logging, index adapter &#x7B49; &#x5916;&#x90E8; &#x4F9D;&#x8D56;
- `data/processed/` : &#x5B58;&#x653E; &#x672C;&#x5730; RAG &#x79CD;&#x5B50; &#x8BED;&#x6599;

&#x9ED8;&#x8BA4; runtime &#x4F7F;&#x7528; `mock` provider, &#x56E0;&#x6B64; &#x5728; API key &#x6216; &#x672C;&#x5730; model &#x672A;&#x914D;&#x7F6E; &#x65F6; &#x4E5F;&#x80FD; &#x8DD1;&#x901A; &#x5B8C;&#x6574; &#x6D41;&#x7A0B;. &#x5207;&#x6362; &#x5230; OpenAI-compatible &#x6216; Ollama &#x65F6;, &#x4E3B;&#x8981; &#x53EA;&#x9700; &#x8C03;&#x6574; env &#x548C; provider &#x5C42;.
