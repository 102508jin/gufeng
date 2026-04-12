import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { SearchableDocument, VectorStore } from "@/lib/infra/vector/vector-store";
import type { RetrievedChunk } from "@/lib/types/retrieval";

export interface SourceRetriever {
  search(query: string, topK?: number): Promise<RetrievedChunk[]>;
}

export class LocalSourceRetriever implements SourceRetriever {
  constructor(private readonly vectorStore: VectorStore = new InMemoryVectorStore()) {}

  async search(query: string, topK = 4): Promise<RetrievedChunk[]> {
    const knowledge = await dataRepository.listKnowledge();
    const documents: SearchableDocument[] = knowledge.map((entry) => ({
      id: entry.id,
      sourceType: "knowledge",
      title: entry.title,
      author: entry.author,
      content: entry.content,
      summary: entry.summary,
      keywords: entry.keywords,
      metadata: {
        category: entry.category,
        credibility: entry.credibility
      }
    }));

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