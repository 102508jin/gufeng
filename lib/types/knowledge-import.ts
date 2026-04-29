export type KnowledgeImportInput = {
  id?: string;
  title: string;
  author?: string;
  category?: string;
  source?: string;
  license?: string;
  era?: string;
  content: string;
  summary?: string;
  keywords?: string[];
  credibility?: "low" | "medium" | "high";
  updatedAt?: string;
};

export type KnowledgeImportResult = {
  imported: number;
  totalRawDocuments: number;
  processedChunks: number;
  vectorDocuments: number;
  updatedAt: string;
};
