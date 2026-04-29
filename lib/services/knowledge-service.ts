import { promises as fs } from "node:fs";
import path from "node:path";

import { LocalSourceRetriever, toSearchableKnowledgeDocuments } from "@/lib/domain/source-retriever";
import { createEmbeddingProvider } from "@/lib/infra/embedding/provider-registry";
import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { logger } from "@/lib/infra/logger";
import { buildVectorIndex, writeVectorIndex } from "@/lib/infra/vector/vector-index";
import type { SourceRef } from "@/lib/types/retrieval";
import { toSourceRef } from "@/lib/utils/retrieval";

export class KnowledgeService {
  constructor(private readonly sourceRetriever = new LocalSourceRetriever()) {}

  async search(query: string, topK = 5): Promise<SourceRef[]> {
    const normalizedTopK = Math.min(Math.max(topK, 1), 10);
    const chunks = await this.sourceRetriever.search(query, normalizedTopK);

    return chunks.map(toSourceRef);
  }

  async reindex(): Promise<{
    personas: number;
    knowledge: number;
    vectorDocuments: number;
    embeddingProvider: string;
    updatedAt: string;
  }> {
    const [personas, knowledge] = await Promise.all([
      dataRepository.listPersonas(),
      dataRepository.listKnowledge()
    ]);
    const embeddingProvider = createEmbeddingProvider();
    const vectorIndex = await buildVectorIndex({
      documents: toSearchableKnowledgeDocuments(knowledge),
      embeddingProvider
    });
    await writeVectorIndex(vectorIndex);

    const result = {
      personas: personas.length,
      knowledge: knowledge.length,
      vectorDocuments: vectorIndex.documents.length,
      embeddingProvider: embeddingProvider.fingerprint,
      updatedAt: new Date().toISOString()
    };

    const statePath = path.join(process.cwd(), "data", "processed", "index-state.json");
    await fs.writeFile(statePath, JSON.stringify(result, null, 2), "utf8");
    logger.info("Rebuilt local index state.", result);
    return result;
  }
}

export const knowledgeService = new KnowledgeService();
