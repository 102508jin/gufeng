import { scoreKeywordOverlap } from "@/lib/utils/text";
import {
  cosineSimilarity,
  formatDocumentForEmbedding,
  type EmbeddingProvider
} from "@/lib/infra/embedding/embedding-provider";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import { logger } from "@/lib/infra/logger";
import {
  getIndexedDocumentVectors,
  readVectorIndex,
  type VectorIndex
} from "@/lib/infra/vector/vector-index";
import type { SearchResult, SearchableDocument, VectorStore } from "@/lib/infra/vector/vector-store";

type InMemoryVectorStoreOptions = {
  vectorIndex?: VectorIndex | null;
};

export class InMemoryVectorStore implements VectorStore {
  constructor(
    private readonly embeddingProvider: EmbeddingProvider = createEmbeddingProvider(),
    private readonly options: InMemoryVectorStoreOptions = {}
  ) {}

  async search(query: string, documents: SearchableDocument[], topK: number): Promise<SearchResult[]> {
    if (topK <= 0 || !documents.length) {
      return [];
    }

    const keywordRanked = documents
      .map((document) => ({
        ...document,
        score: scoreKeywordOverlap(query, document.content, document.keywords)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);

    try {
      const vectorIndex = this.options.vectorIndex !== undefined
        ? this.options.vectorIndex
        : await readVectorIndex();
      const indexedVectors = getIndexedDocumentVectors(vectorIndex, this.embeddingProvider, documents);
      const missingDocuments = documents.filter((document) => !indexedVectors.has(document.id));
      const embeddings = await this.embeddingProvider.embedTexts([
        query,
        ...missingDocuments.map(formatDocumentForEmbedding)
      ]);
      const queryEmbedding = embeddings[0] ?? [];
      const computedVectors = new Map(
        missingDocuments.map((document, index) => [document.id, embeddings[index + 1] ?? []])
      );

      return documents
        .map((document) => {
          const keywordScore = scoreKeywordOverlap(query, document.content, document.keywords);
          const documentVector = indexedVectors.get(document.id) ?? computedVectors.get(document.id) ?? [];
          const embeddingScore = Math.max(0, cosineSimilarity(queryEmbedding, documentVector));

          return {
            ...document,
            score: keywordScore + embeddingScore
          };
        })
        .filter((document) => document.score > 0.05)
        .sort((left, right) => right.score - left.score)
        .slice(0, topK);
    } catch (error) {
      logger.warn("Embedding 检索失败，已回退到关键词排序。", {
        provider: this.embeddingProvider.kind,
        error: error instanceof Error ? error.message : String(error)
      });

      return keywordRanked.filter((document) => document.score > 0);
    }
  }
}
