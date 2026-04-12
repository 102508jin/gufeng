import { scoreKeywordOverlap } from "@/lib/utils/text";
import type { SearchResult, SearchableDocument, VectorStore } from "@/lib/infra/vector/vector-store";

export class InMemoryVectorStore implements VectorStore {
  async search(query: string, documents: SearchableDocument[], topK: number): Promise<SearchResult[]> {
    return documents
      .map((document) => ({
        ...document,
        score: scoreKeywordOverlap(query, document.content, document.keywords)
      }))
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }
}