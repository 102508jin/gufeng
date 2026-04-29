import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  formatDocumentForEmbedding,
  type EmbeddingProvider
} from "@/lib/infra/embedding/embedding-provider";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import type { SearchableDocument } from "@/lib/infra/vector/vector-store";

export type VectorIndexDocument = {
  id: string;
  contentHash: string;
  vector: number[];
};

export type VectorIndex = {
  version: 1;
  createdAt: string;
  provider: {
    kind: string;
    fingerprint: string;
  };
  documents: VectorIndexDocument[];
};

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

function normalizeVectorIndex(input: unknown): VectorIndex | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as {
    version?: unknown;
    createdAt?: unknown;
    provider?: { kind?: unknown; fingerprint?: unknown };
    documents?: unknown;
  };

  if (
    record.version !== 1
    || typeof record.createdAt !== "string"
    || typeof record.provider?.kind !== "string"
    || typeof record.provider?.fingerprint !== "string"
    || !Array.isArray(record.documents)
  ) {
    return null;
  }

  const documents = record.documents.flatMap((item) => {
    const document = item as Partial<VectorIndexDocument>;
    if (
      typeof document.id !== "string"
      || typeof document.contentHash !== "string"
      || !isNumberArray(document.vector)
    ) {
      return [];
    }

    return [{
      id: document.id,
      contentHash: document.contentHash,
      vector: document.vector
    }];
  });

  return {
    version: 1,
    createdAt: record.createdAt,
    provider: {
      kind: record.provider.kind,
      fingerprint: record.provider.fingerprint
    },
    documents
  };
}

export function getDefaultVectorIndexPath(): string {
  return path.join(process.cwd(), "data", "processed", "vector-index.json");
}

export function getDocumentContentHash(document: SearchableDocument): string {
  return createHash("sha256").update(formatDocumentForEmbedding(document)).digest("hex");
}

export async function buildVectorIndex(params: {
  documents: SearchableDocument[];
  embeddingProvider?: EmbeddingProvider;
  createdAt?: string;
}): Promise<VectorIndex> {
  const embeddingProvider = params.embeddingProvider ?? createEmbeddingProvider();
  const vectors = await embeddingProvider.embedTexts(params.documents.map(formatDocumentForEmbedding));

  return {
    version: 1,
    createdAt: params.createdAt ?? new Date().toISOString(),
    provider: {
      kind: embeddingProvider.kind,
      fingerprint: embeddingProvider.fingerprint
    },
    documents: params.documents.map((document, index) => ({
      id: document.id,
      contentHash: getDocumentContentHash(document),
      vector: vectors[index] ?? []
    }))
  };
}

export async function readVectorIndex(filePath = getDefaultVectorIndexPath()): Promise<VectorIndex | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeVectorIndex(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function writeVectorIndex(index: VectorIndex, filePath = getDefaultVectorIndexPath()): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

export function getIndexedDocumentVectors(
  index: VectorIndex | null,
  embeddingProvider: EmbeddingProvider,
  documents: SearchableDocument[]
): Map<string, number[]> {
  const vectors = new Map<string, number[]>();
  if (!index || index.provider.fingerprint !== embeddingProvider.fingerprint) {
    return vectors;
  }

  const indexById = new Map(index.documents.map((document) => [document.id, document]));
  for (const document of documents) {
    const indexed = indexById.get(document.id);
    if (indexed?.contentHash === getDocumentContentHash(document)) {
      vectors.set(document.id, indexed.vector);
    }
  }

  return vectors;
}
