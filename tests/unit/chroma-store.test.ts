import { describe, expect, it } from "vitest";

import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";
import { ChromaVectorStore } from "@/lib/infra/vector/chroma-store";
import type { SearchableDocument } from "@/lib/infra/vector/vector-store";

function createResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function createProvider(): EmbeddingProvider {
  return {
    kind: "test",
    fingerprint: "test:2",
    async embedTexts(texts) {
      return texts.map((_, index) => [index + 1, index + 2]);
    }
  };
}

function createDocument(id: string): SearchableDocument {
  return {
    id,
    sourceType: "knowledge",
    title: `标题 ${id}`,
    content: `内容 ${id}`,
    keywords: ["修身"],
    metadata: {
      category: "ethics",
      source: "test",
      license: "test",
      era: "modern",
      credibility: "high",
      updatedAt: "2026-05-06",
      documentId: id,
      chunkId: id,
      chunkIndex: 0
    }
  };
}

describe("chroma vector store", () => {
  it("creates a collection and upserts embedded documents", async () => {
    const calls: Array<{ url: string; body?: unknown }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({
        url: String(input),
        body: init?.body ? JSON.parse(String(init.body)) as unknown : undefined
      });
      return createResponse({ id: "collection-1", name: "wenyan" });
    };
    const store = new ChromaVectorStore({
      baseUrl: "http://127.0.0.1:8000/",
      collection: "wenyan",
      embeddingProvider: createProvider(),
      fetcher
    });

    await expect(store.upsertDocuments([createDocument("doc-1")])).resolves.toBe(1);

    expect(calls[0]?.url).toContain("/collections");
    expect(calls[1]?.url).toContain("/collections/collection-1/upsert");
    expect(calls[1]?.body).toMatchObject({
      ids: ["doc-1"],
      embeddings: [[1, 2]]
    });
  });

  it("maps query ids back to local documents", async () => {
    const fetcher: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/query")) {
        return createResponse({
          ids: [["doc-2", "missing"]],
          distances: [[0.25, 0.5]]
        });
      }

      return createResponse({ id: "collection-1", name: "wenyan" });
    };
    const store = new ChromaVectorStore({
      collection: "wenyan",
      embeddingProvider: createProvider(),
      fetcher
    });

    const results = await store.search("修身", [createDocument("doc-1"), createDocument("doc-2")], 2);

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("doc-2");
    expect(results[0]?.score).toBeCloseTo(0.8);
  });
});
