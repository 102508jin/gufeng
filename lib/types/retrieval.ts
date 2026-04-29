export type SourceType = "persona" | "knowledge";

export type SourceMetadataValue = string | number | boolean | null;

export type SourceMetadata = {
  [key: string]: SourceMetadataValue | undefined;
  category?: string;
  source?: string;
  license?: string;
  era?: string;
  credibility?: "low" | "medium" | "high";
  updatedAt?: string;
  chunkId?: string;
  documentId?: string;
  chunkIndex?: number;
};

export type SourceRef = {
  id: string;
  sourceType: SourceType;
  title: string;
  author?: string;
  excerpt: string;
  score: number;
  source?: string;
  license?: string;
  era?: string;
  credibility?: "low" | "medium" | "high";
  updatedAt?: string;
  chunkId?: string;
  documentId?: string;
};

export type RetrievedChunk = {
  id: string;
  sourceType: SourceType;
  title: string;
  author?: string;
  content: string;
  summary?: string;
  score: number;
  metadata: SourceMetadata;
};

export type KnowledgeRecord = {
  id: string;
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  title: string;
  author?: string;
  category: string;
  source: string;
  license: string;
  era?: string;
  content: string;
  summary?: string;
  keywords: string[];
  credibility: "low" | "medium" | "high";
  updatedAt: string;
};
