import { env } from "@/lib/config/env";
import {
  formatDocumentForEmbedding,
  type EmbeddingProvider
} from "@/lib/infra/embedding/embedding-provider";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { SearchResult, SearchableDocument, WritableVectorStore } from "@/lib/infra/vector/vector-store";
import { logger } from "@/lib/infra/logger";

type ChromaCollection = {
  id?: string;
  name?: string;
};

type ChromaQueryResponse = {
  ids?: string[][];
  distances?: Array<Array<number | null> | null> | null;
};

export type ChromaVectorStoreOptions = {
  baseUrl?: string;
  tenant?: string;
  database?: string;
  collection?: string;
  token?: string;
  embeddingProvider?: EmbeddingProvider;
  fallbackStore?: WritableVectorStore | InMemoryVectorStore;
  fetcher?: typeof fetch;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/u, "");
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

function toPathPart(value: string): string {
  return encodeURIComponent(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readCollection(value: unknown): ChromaCollection {
  return isRecord(value) ? { id: typeof value.id === "string" ? value.id : undefined, name: typeof value.name === "string" ? value.name : undefined } : {};
}

function readCollections(value: unknown): ChromaCollection[] {
  return Array.isArray(value) ? value.map(readCollection) : [];
}

function readQueryResponse(value: unknown): ChromaQueryResponse {
  if (!isRecord(value)) {
    return {};
  }

  return {
    ids: Array.isArray(value.ids) ? value.ids as string[][] : undefined,
    distances: Array.isArray(value.distances) ? value.distances as Array<Array<number | null> | null> : null
  };
}

function toChromaMetadata(document: SearchableDocument): Record<string, string | number | boolean> {
  return {
    sourceType: document.sourceType,
    title: document.title,
    author: document.author ?? "",
    summary: document.summary ?? "",
    keywords: document.keywords.join(","),
    category: document.metadata.category ?? "",
    source: document.metadata.source ?? "",
    license: document.metadata.license ?? "",
    era: document.metadata.era ?? "",
    credibility: document.metadata.credibility ?? "",
    updatedAt: document.metadata.updatedAt ?? "",
    chunkId: document.metadata.chunkId ?? "",
    documentId: document.metadata.documentId ?? "",
    chunkIndex: document.metadata.chunkIndex ?? 0
  };
}

function scoreFromDistance(distance: number | null | undefined): number {
  if (typeof distance !== "number" || !Number.isFinite(distance)) {
    return 0;
  }

  return 1 / (1 + Math.max(distance, 0));
}

export class ChromaVectorStore implements WritableVectorStore {
  private collectionIdPromise: Promise<string> | null = null;
  private readonly baseUrl: string;
  private readonly tenant: string;
  private readonly database: string;
  private readonly collection: string;
  private readonly token: string;
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly fallbackStore: WritableVectorStore | InMemoryVectorStore;
  private readonly fetcher: typeof fetch;

  constructor(options: ChromaVectorStoreOptions = {}) {
    this.baseUrl = options.baseUrl ?? env.chromaBaseUrl;
    this.tenant = options.tenant ?? env.chromaTenant;
    this.database = options.database ?? env.chromaDatabase;
    this.collection = options.collection ?? env.chromaCollection;
    this.token = options.token ?? env.chromaToken;
    this.embeddingProvider = options.embeddingProvider ?? createEmbeddingProvider();
    this.fallbackStore = options.fallbackStore ?? new InMemoryVectorStore(this.embeddingProvider);
    this.fetcher = options.fetcher ?? fetch;
  }

  async search(query: string, documents: SearchableDocument[], topK: number): Promise<SearchResult[]> {
    if (topK <= 0 || !documents.length) {
      return [];
    }

    try {
      const collectionId = await this.getCollectionId();
      const [queryEmbedding] = await this.embeddingProvider.embedTexts([query]);
      const response = await this.request(
        `/api/v2/tenants/${toPathPart(this.tenant)}/databases/${toPathPart(this.database)}/collections/${toPathPart(collectionId)}/query`,
        {
          method: "POST",
          body: JSON.stringify({
            query_embeddings: [queryEmbedding ?? []],
            n_results: topK,
            include: ["distances"]
          })
        }
      );
      const payload = readQueryResponse(await response.json());
      const ids = payload.ids?.[0] ?? [];
      const distances = payload.distances?.[0] ?? [];
      const documentMap = new Map(documents.map((document) => [document.id, document]));

      return ids
        .map((id, index) => {
          const document = documentMap.get(id);
          return document ? { ...document, score: scoreFromDistance(distances[index]) } : null;
        })
        .filter((item): item is SearchResult => Boolean(item))
        .slice(0, topK);
    } catch (error) {
      logger.warn("Chroma 检索失败，已回退到本地向量检索。", {
        collection: this.collection,
        error: error instanceof Error ? error.message : String(error)
      });
      return this.fallbackStore.search(query, documents, topK);
    }
  }

  async upsertDocuments(documents: SearchableDocument[]): Promise<number> {
    if (!documents.length) {
      return 0;
    }

    const collectionId = await this.getCollectionId();
    const embeddings = await this.embeddingProvider.embedTexts(documents.map(formatDocumentForEmbedding));
    await this.request(
      `/api/v2/tenants/${toPathPart(this.tenant)}/databases/${toPathPart(this.database)}/collections/${toPathPart(collectionId)}/upsert`,
      {
        method: "POST",
        body: JSON.stringify({
          ids: documents.map((document) => document.id),
          embeddings,
          documents: documents.map(formatDocumentForEmbedding),
          metadatas: documents.map(toChromaMetadata)
        })
      }
    );

    return documents.length;
  }

  private async getCollectionId(): Promise<string> {
    this.collectionIdPromise ??= this.resolveCollectionId();
    return this.collectionIdPromise;
  }

  private async resolveCollectionId(): Promise<string> {
    const collectionPath = `/api/v2/tenants/${toPathPart(this.tenant)}/databases/${toPathPart(this.database)}/collections`;
    const created = await this.request(collectionPath, {
      method: "POST",
      body: JSON.stringify({
        name: this.collection,
        get_or_create: true,
        metadata: {
          app: "wenyan-agent",
          embeddingProvider: this.embeddingProvider.fingerprint
        }
      })
    });
    const createdCollection = readCollection(await created.json());
    if (createdCollection.id) {
      return createdCollection.id;
    }

    const listed = await this.request(collectionPath);
    const matched = readCollections(await listed.json()).find((collection) => collection.name === this.collection);
    if (!matched?.id) {
      throw new Error(`Chroma collection not found: ${this.collection}`);
    }

    return matched.id;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) {
      headers.set("x-chroma-token", this.token);
    }

    const response = await this.fetcher(joinUrl(this.baseUrl, path), {
      ...init,
      headers
    });
    if (!response.ok) {
      throw new Error(`Chroma request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }
}
