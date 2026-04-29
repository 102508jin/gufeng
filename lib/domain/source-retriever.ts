import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { SearchableDocument, VectorStore } from "@/lib/infra/vector/vector-store";
import type { RetrievedChunk } from "@/lib/types/retrieval";
import type { KnowledgeRecord } from "@/lib/types/retrieval";

export interface SourceRetriever {
  search(query: string, topK?: number): Promise<RetrievedChunk[]>;
}

export function toSearchableKnowledgeDocuments(knowledge: KnowledgeRecord[]): SearchableDocument[] {
  return knowledge.map((entry) => ({
    id: entry.id,
    sourceType: "knowledge",
    title: entry.title,
    author: entry.author,
    content: entry.content,
    summary: entry.summary,
    keywords: entry.keywords,
    metadata: {
      category: entry.category,
      source: entry.source,
      license: entry.license,
      era: entry.era,
      credibility: entry.credibility,
      updatedAt: entry.updatedAt,
      chunkId: entry.chunkId,
      documentId: entry.documentId,
      chunkIndex: entry.chunkIndex
    }
  }));
}

export class LocalSourceRetriever implements SourceRetriever {
  constructor(private readonly vectorStore: VectorStore = new InMemoryVectorStore()) {}

  async search(query: string, topK = 4): Promise<RetrievedChunk[]> {
    const knowledge = await dataRepository.listKnowledge();
    const documents = toSearchableKnowledgeDocuments(knowledge);

    const results = await this.vectorStore.search(query, documents, topK);
    return results.map((item) => ({
      id: item.id,
      sourceType: item.sourceType,
      title: item.title,
      author: item.author,
      content: item.content,
      summary: item.summary,
      score: item.score,
      metadata: item.metadata
    }));
  }
}
