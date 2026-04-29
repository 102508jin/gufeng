import { afterEach, describe, expect, it, vi } from "vitest";

import { cosineSimilarity } from "@/lib/infra/embedding/embedding-provider";
import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";
import { LocalEmbeddingProvider } from "@/lib/infra/embedding/local-embedding-provider";
import { OpenAiCompatibleEmbeddingProvider } from "@/lib/infra/embedding/openai-compatible-embedding-provider";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { SearchableDocument } from "@/lib/infra/vector/vector-store";

describe("embedding providers", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("creates deterministic local embeddings", async () => {
    const provider = new LocalEmbeddingProvider(32);
    const [first, second, third] = await provider.embedTexts([
      "拖延 自律 计划",
      "拖延 自律 计划",
      "山水 自然 闲适"
    ]);

    expect(first).toEqual(second);
    expect(cosineSimilarity(first, second)).toBeCloseTo(1);
    expect(cosineSimilarity(first, third)).toBeLessThan(1);
  });

  it("calls OpenAI-compatible embeddings endpoint", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      data: [
        { index: 1, embedding: [0, 1] },
        { index: 0, embedding: [1, 0] }
      ]
    }), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const provider = new OpenAiCompatibleEmbeddingProvider({
      id: "test",
      label: "Test Embedding",
      driver: "openai-compatible",
      model: "test-embedding",
      baseUrl: "http://127.0.0.1:8000/v1",
      apiKey: "test-key"
    });
    const embeddings = await provider.embedTexts(["甲", "乙"]);
    const request = fetchMock.mock.calls[0];
    const body = JSON.parse(String(request[1]?.body)) as { model: string; input: string[] };
    const headers = request[1]?.headers as Record<string, string>;

    expect(String(request[0])).toBe("http://127.0.0.1:8000/v1/embeddings");
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(body).toEqual({ model: "test-embedding", input: ["甲", "乙"] });
    expect(embeddings).toEqual([[1, 0], [0, 1]]);
  });
});

describe("in-memory vector store", () => {
  const documents: SearchableDocument[] = [
    {
      id: "doc-a",
      sourceType: "knowledge",
      title: "山水闲适",
      content: "山水自然，闲适自守。",
      keywords: ["山水", "自然"],
      metadata: {}
    },
    {
      id: "doc-b",
      sourceType: "knowledge",
      title: "规划执行",
      content: "先定今日可行之事，再日日省察。",
      keywords: ["规划", "执行"],
      metadata: {}
    }
  ];

  it("ranks documents with embedding similarity", async () => {
    const provider: EmbeddingProvider = {
      kind: "test",
      fingerprint: "test",
      async embedTexts(texts: string[]) {
        return texts.map((_, index) => {
          if (index === 0) {
            return [1, 0];
          }

          return index === 2 ? [1, 0] : [0, 1];
        });
      }
    };
    const store = new InMemoryVectorStore(provider);
    const results = await store.search("如何执行计划", documents, 2);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("doc-b");
    expect(results[0].score).toBeGreaterThan(0.9);
  });

  it("falls back to keyword ranking when embeddings fail", async () => {
    const provider: EmbeddingProvider = {
      kind: "failing-test",
      fingerprint: "failing-test",
      async embedTexts() {
        throw new Error("embedding unavailable");
      }
    };
    const store = new InMemoryVectorStore(provider);
    const results = await store.search("自然", documents, 2);

    expect(results[0].id).toBe("doc-a");
  });
});
