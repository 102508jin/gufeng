import type { KnowledgeRecord } from "@/lib/types/retrieval";
import { splitIntoChunks } from "@/lib/utils/split";
import { extractKeywords, normalizeWhitespace, toExcerpt } from "@/lib/utils/text";

export type RawKnowledgeDocument = {
  id: string;
  title: string;
  author?: string;
  category: string;
  source: string;
  license: string;
  era?: string;
  content: string;
  summary?: string;
  keywords?: string[];
  credibility: "low" | "medium" | "high";
  updatedAt: string;
};

export type KnowledgeIngestionOptions = {
  chunkSize?: number;
  overlap?: number;
};

type PartialKnowledgeRecord = {
  id?: unknown;
  documentId?: unknown;
  chunkId?: unknown;
  chunkIndex?: unknown;
  title?: unknown;
  author?: unknown;
  category?: unknown;
  source?: unknown;
  license?: unknown;
  era?: unknown;
  content?: unknown;
  summary?: unknown;
  keywords?: unknown;
  credibility?: unknown;
  updatedAt?: unknown;
};

const DEFAULT_UPDATED_AT = "2026-04-29";

function isCredibility(value: unknown): value is RawKnowledgeDocument["credibility"] {
  return value === "low" || value === "medium" || value === "high";
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid knowledge document: missing ${field}.`);
  }

  return normalizeWhitespace(value);
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? normalizeWhitespace(value) : undefined;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean);

  return values.length ? [...new Set(values)] : undefined;
}

export function normalizeRawKnowledgeDocument(input: unknown): RawKnowledgeDocument {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid knowledge document: expected object.");
  }

  const record = input as PartialKnowledgeRecord;
  const credibility = isCredibility(record.credibility) ? record.credibility : null;
  if (!credibility) {
    throw new Error("Invalid knowledge document: missing credibility.");
  }

  return {
    id: readRequiredString(record.id, "id"),
    title: readRequiredString(record.title, "title"),
    author: readOptionalString(record.author),
    category: readRequiredString(record.category, "category"),
    source: readRequiredString(record.source, "source"),
    license: readRequiredString(record.license, "license"),
    era: readOptionalString(record.era),
    content: readRequiredString(record.content, "content"),
    summary: readOptionalString(record.summary),
    keywords: readStringArray(record.keywords),
    credibility,
    updatedAt: readRequiredString(record.updatedAt, "updatedAt")
  };
}

export function buildKnowledgeRecords(
  documents: RawKnowledgeDocument[],
  options: KnowledgeIngestionOptions = {}
): KnowledgeRecord[] {
  return documents.flatMap((document) => {
    const chunks = splitIntoChunks(document.content, options.chunkSize ?? 160, options.overlap ?? 20);
    const keywords = document.keywords?.length ? document.keywords : extractKeywords(document.content);

    return chunks.map((chunk, index) => {
      const chunkId = `${document.id}-chunk-${index + 1}`;
      return {
        id: chunkId,
        documentId: document.id,
        chunkId,
        chunkIndex: index,
        title: chunks.length > 1 ? `${document.title}（${index + 1}）` : document.title,
        author: document.author,
        category: document.category,
        source: document.source,
        license: document.license,
        era: document.era,
        content: chunk,
        summary: document.summary ? toExcerpt(document.summary, 96) : undefined,
        keywords,
        credibility: document.credibility,
        updatedAt: document.updatedAt
      };
    });
  });
}

export function normalizeKnowledgeRecord(input: unknown): KnowledgeRecord | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as PartialKnowledgeRecord;
  if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.content !== "string") {
    return null;
  }

  const credibility = isCredibility(record.credibility) ? record.credibility : "medium";
  const keywords = readStringArray(record.keywords) ?? extractKeywords(record.content);
  const id = normalizeWhitespace(record.id);

  return {
    id,
    documentId: readOptionalString(record.documentId) ?? id,
    chunkId: readOptionalString(record.chunkId) ?? id,
    chunkIndex: typeof record.chunkIndex === "number" ? record.chunkIndex : 0,
    title: normalizeWhitespace(record.title),
    author: readOptionalString(record.author),
    category: readOptionalString(record.category) ?? "general",
    source: readOptionalString(record.source) ?? readOptionalString(record.author) ?? "sample-corpus",
    license: readOptionalString(record.license) ?? "internal-sample",
    era: readOptionalString(record.era) ?? "modern",
    content: normalizeWhitespace(record.content),
    summary: readOptionalString(record.summary),
    keywords,
    credibility,
    updatedAt: readOptionalString(record.updatedAt) ?? DEFAULT_UPDATED_AT
  };
}
