import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  buildKnowledgeRecords,
  normalizeRawKnowledgeDocument,
  type RawKnowledgeDocument
} from "@/lib/domain/knowledge-ingestion";
import { toSearchableKnowledgeDocuments } from "@/lib/domain/source-retriever";
import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import { buildVectorIndex, getDefaultVectorIndexPath, writeVectorIndex } from "@/lib/infra/vector/vector-index";
import type { KnowledgeImportInput, KnowledgeImportResult } from "@/lib/types/knowledge-import";

type KnowledgeImportServiceOptions = {
  rawDir?: string;
  importsPath?: string;
  processedPath?: string;
  vectorIndexPath?: string;
  indexStatePath?: string;
};

function getDefaultRawDir(): string {
  return path.join(process.cwd(), "data", "raw", "knowledge");
}

function getDefaultProcessedPath(): string {
  return path.join(process.cwd(), "data", "processed", "knowledge.json");
}

function getDefaultIndexStatePath(): string {
  return path.join(process.cwd(), "data", "processed", "index-state.json");
}

function normalizeText(value: string | undefined, fallback = ""): string {
  return value?.trim().replace(/\s+/gu, " ") || fallback;
}

function normalizeContent(value: string): string {
  return value.trim().replace(/\r\n?/gu, "\n");
}

function createDocumentId(input: KnowledgeImportInput): string {
  if (input.id?.trim()) {
    const sanitized = input.id.trim().replace(/[^\w-]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 80);
    if (sanitized) {
      return sanitized;
    }
  }

  const hash = createHash("sha1").update(`${input.title}\n${input.content}`).digest("hex").slice(0, 12);
  return `user-import-${hash}`;
}

function uniqueDocumentId(baseId: string, existingIds: Set<string>): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let index = 2;
  while (existingIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  return `${baseId}-${index}`;
}

async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function normalizeImportInput(input: KnowledgeImportInput, existingIds: Set<string>): RawKnowledgeDocument {
  const title = normalizeText(input.title);
  const content = normalizeContent(input.content);
  if (!title) {
    throw new Error("导入文档缺少标题。");
  }

  if (content.length < 8) {
    throw new Error("导入文档内容过短。");
  }

  const id = uniqueDocumentId(createDocumentId(input), existingIds);
  existingIds.add(id);

  return normalizeRawKnowledgeDocument({
    id,
    title,
    author: normalizeText(input.author) || undefined,
    category: normalizeText(input.category, "user-import"),
    source: normalizeText(input.source, "user-import"),
    license: normalizeText(input.license, "user-provided"),
    era: normalizeText(input.era, "unknown"),
    content,
    summary: normalizeText(input.summary) || undefined,
    keywords: input.keywords?.map((keyword) => normalizeText(keyword)).filter(Boolean),
    credibility: input.credibility ?? "medium",
    updatedAt: input.updatedAt ?? new Date().toISOString().slice(0, 10)
  });
}

export class KnowledgeImportService {
  private readonly rawDir: string;
  private readonly importsPath: string;
  private readonly processedPath: string;
  private readonly vectorIndexPath: string;
  private readonly indexStatePath: string;

  constructor(options: KnowledgeImportServiceOptions = {}) {
    this.rawDir = options.rawDir ?? getDefaultRawDir();
    this.importsPath = options.importsPath ?? path.join(this.rawDir, "user-imports.json");
    this.processedPath = options.processedPath ?? getDefaultProcessedPath();
    this.vectorIndexPath = options.vectorIndexPath ?? getDefaultVectorIndexPath();
    this.indexStatePath = options.indexStatePath ?? getDefaultIndexStatePath();
  }

  async importDocuments(inputs: KnowledgeImportInput[]): Promise<KnowledgeImportResult> {
    if (!inputs.length) {
      throw new Error("没有可导入的知识文档。");
    }

    const existingImports = await this.readUserImports();
    const existingRawDocuments = await this.readRawKnowledgeDocuments();
    const existingIds = new Set(existingRawDocuments.map((document) => document.id));
    const imported = inputs.map((input) => normalizeImportInput(input, existingIds));
    const nextImports = [...existingImports, ...imported];

    await fs.mkdir(this.rawDir, { recursive: true });
    await fs.writeFile(this.importsPath, `${JSON.stringify(nextImports, null, 2)}\n`, "utf8");

    return this.rebuildCorpus(imported.length);
  }

  async rebuildCorpus(imported = 0): Promise<KnowledgeImportResult> {
    const documents = await this.readRawKnowledgeDocuments();
    const records = buildKnowledgeRecords(documents);
    const embeddingProvider = createEmbeddingProvider();
    const vectorIndex = await buildVectorIndex({
      documents: toSearchableKnowledgeDocuments(records),
      embeddingProvider
    });
    const personas = await dataRepository.listPersonas();
    const updatedAt = new Date().toISOString();
    const result = {
      imported,
      totalRawDocuments: documents.length,
      processedChunks: records.length,
      vectorDocuments: vectorIndex.documents.length,
      updatedAt
    };

    await fs.mkdir(path.dirname(this.processedPath), { recursive: true });
    await fs.writeFile(this.processedPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await writeVectorIndex(vectorIndex, this.vectorIndexPath);
    await fs.writeFile(
      this.indexStatePath,
      `${JSON.stringify({
        personas: personas.length,
        knowledge: records.length,
        vectorDocuments: vectorIndex.documents.length,
        embeddingProvider: embeddingProvider.fingerprint,
        updatedAt
      }, null, 2)}\n`,
      "utf8"
    );

    return result;
  }

  private async readUserImports(): Promise<RawKnowledgeDocument[]> {
    const parsed = await readJsonFile(this.importsPath);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeRawKnowledgeDocument);
  }

  private async readRawKnowledgeDocuments(): Promise<RawKnowledgeDocument[]> {
    let entries;
    try {
      entries = await fs.readdir(this.rawDir, { withFileTypes: true });
    } catch {
      return [];
    }
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
    const documents: RawKnowledgeDocument[] = [];

    for (const fileName of jsonFiles) {
      const parsed = await readJsonFile(path.join(this.rawDir, fileName));
      const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      for (const item of items) {
        documents.push(normalizeRawKnowledgeDocument(item));
      }
    }

    return documents;
  }
}

export const knowledgeImportService = new KnowledgeImportService();
