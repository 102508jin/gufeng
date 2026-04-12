export type SourceType = "persona" | "knowledge";

export type SourceRef = {
  id: string;
  sourceType: SourceType;
  title: string;
  author?: string;
  excerpt: string;
  score: number;
};

export type RetrievedChunk = {
  id: string;
  sourceType: SourceType;
  title: string;
  author?: string;
  content: string;
  summary?: string;
  score: number;
  metadata: Record<string, string | number | boolean | null>;
};

export type KnowledgeRecord = {
  id: string;
  title: string;
  author?: string;
  category: string;
  content: string;
  summary?: string;
  keywords: string[];
  credibility: "low" | "medium" | "high";
};