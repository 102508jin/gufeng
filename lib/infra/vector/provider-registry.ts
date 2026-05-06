import { env } from "@/lib/config/env";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import { ChromaVectorStore } from "@/lib/infra/vector/chroma-store";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { VectorStore, WritableVectorStore } from "@/lib/infra/vector/vector-store";

export type VectorStoreDriver = "local" | "chroma";

function normalizeVectorStoreDriver(value: string | undefined): VectorStoreDriver {
  return value === "chroma" ? "chroma" : "local";
}

export function resolveVectorStoreDriver(): VectorStoreDriver {
  return normalizeVectorStoreDriver(env.vectorStore);
}

export function createVectorStore(): VectorStore {
  const embeddingProvider = createEmbeddingProvider();
  if (resolveVectorStoreDriver() === "chroma") {
    return new ChromaVectorStore({
      embeddingProvider,
      fallbackStore: new InMemoryVectorStore(embeddingProvider)
    });
  }

  return new InMemoryVectorStore(embeddingProvider);
}

export function createWritableVectorStore(): WritableVectorStore | null {
  const embeddingProvider = createEmbeddingProvider();
  if (resolveVectorStoreDriver() === "chroma") {
    return new ChromaVectorStore({
      embeddingProvider,
      fallbackStore: new InMemoryVectorStore(embeddingProvider)
    });
  }

  return null;
}
