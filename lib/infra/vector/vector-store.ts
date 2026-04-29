import type { SourceType } from "@/lib/types/retrieval";

export type SearchableDocument = {
  id: string;
  sourceType: SourceType;
  title: string;
  author?: string;
  content: string;
  summary?: string;
  keywords: string[];
  metadata: Record<string, string | number | boolean | null>;
};

export type SearchResult = SearchableDocument & {
  score: number;
};

export interface VectorStore {
  search(query: string, documents: SearchableDocument[], topK: number): Promise<SearchResult[]>;
}