import { promises as fs } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import {
  buildVectorIndex,
  getIndexedDocumentVectors,
  readVectorIndex,
  writeVectorIndex
} from "@/lib/infra/vector/vector-index";
import type { SearchableDocument } from "@/lib/infra/vector/vector-store";

const indexPath = path.join(process.cwd(), "tests", ".tmp-vector-index.json");

const documents: SearchableDocument[] = [
  {
    id: "knowledge-a",
    sourceType: "knowledge",
    title: "自律规划",
    content: "今日立一小事，日日省察。",
    keywords: ["自律", "规划"],
    metadata: {
      chunkId: "knowledge-a"
    }
  },
  {
    id: "knowledge-b",
    sourceType: "knowledge",
    title: "山水闲适",
    content: "山水自然，闲适自守。",
    keywords: ["山水", "自然"],
    metadata: {
      chunkId: "knowledge-b"
    }
  }
];

function createProvider(): EmbeddingProvider {
  return {
    kind: "test",
    fingerprint: "test:v1",
    async embedTexts(texts: string[]) {
      return texts.map((text) => {
        if (text.includes("自律") || text.includes("规划")) {
          return [1, 0];
        }

        if (text.includes("山水") || text.includes("自然")) {
          return [0, 1];
        }

        return [0, 0];
      });
    }
  };
}

describe("vector index", () => {
  afterEach(async () => {
    await fs.rm(indexPath, { force: true });
  });

  it("writes and reads a traceable vector index", async () => {
    const provider = createProvider();
    const index = await buildVectorIndex({
      documents,
      embeddingProvider: provider,
      createdAt: "2026-04-30T00:00:00.000Z"
    });

    await writeVectorIndex(index, indexPath);
    const restored = await readVectorIndex(indexPath);

    expect(restored?.provider.fingerprint).toBe("test:v1");
    expect(restored?.documents).toHaveLength(2);
    expect(restored?.documents[0].contentHash).toHaveLength(64);
  });

  it("returns only provider-compatible and content-matching vectors", async () => {
    const provider = createProvider();
    const index = await buildVectorIndex({ documents, embeddingProvider: provider });
    const changedDocuments = [
      documents[0],
      {
        ...documents[1],
        content: "内容已改变。"
      }
    ];

    const vectors = getIndexedDocumentVectors(index, provider, changedDocuments);

    expect(vectors.has("knowledge-a")).toBe(true);
    expect(vectors.has("knowledge-b")).toBe(false);
  });

  it("reuses indexed document vectors during search", async () => {
    const index = await buildVectorIndex({
      documents,
      embeddingProvider: createProvider()
    });
    const queryOnlyProvider: EmbeddingProvider = {
      kind: "test",
      fingerprint: "test:v1",
      async embedTexts(texts: string[]) {
        expect(texts).toHaveLength(1);
        return [[1, 0]];
      }
    };
    const store = new InMemoryVectorStore(queryOnlyProvider, { vectorIndex: index });
    const results = await store.search("如何自律规划", documents, 2);

    expect(results[0].id).toBe("knowledge-a");
  });
});
