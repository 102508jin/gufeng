import { promises as fs } from "node:fs";
import path from "node:path";

import { LocalSourceRetriever } from "@/lib/domain/source-retriever";
import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { logger } from "@/lib/infra/logger";
import type { SourceRef } from "@/lib/types/retrieval";
import { toExcerpt } from "@/lib/utils/text";

export class KnowledgeService {
  constructor(private readonly sourceRetriever = new LocalSourceRetriever()) {}

  async search(query: string, topK = 5): Promise<SourceRef[]> {
    const normalizedTopK = Math.min(Math.max(topK, 1), 10);
    const chunks = await this.sourceRetriever.search(query, normalizedTopK);

    return chunks.map((chunk) => ({
      id: chunk.id,
      sourceType: chunk.sourceType,
      title: chunk.title,
      author: chunk.author,
      excerpt: toExcerpt(chunk.summary ?? chunk.content),
      score: chunk.score
    }));
  }

  async reindex(): Promise<{ personas: number; knowledge: number; updatedAt: string }> {
    const [personas, knowledge] = await Promise.all([
      dataRepository.listPersonas(),
      dataRepository.listKnowledge()
    ]);

    const result = {
      personas: personas.length,
      knowledge: knowledge.length,
      updatedAt: new Date().toISOString()
    };

    const statePath = path.join(process.cwd(), "data", "processed", "index-state.json");
    await fs.writeFile(statePath, JSON.stringify(result, null, 2), "utf8");
    logger.info("Rebuilt local index state.", result);
    return result;
  }
}

export const knowledgeService = new KnowledgeService();
