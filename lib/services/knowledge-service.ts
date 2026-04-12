import { promises as fs } from "node:fs";
import path from "node:path";

import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { logger } from "@/lib/infra/logger";

export class KnowledgeService {
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