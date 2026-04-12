import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { InMemoryVectorStore } from "@/lib/infra/vector/in-memory-store";
import type { SearchableDocument, VectorStore } from "@/lib/infra/vector/vector-store";
import type { PersonaProfile } from "@/lib/types/persona";
import type { RetrievedChunk } from "@/lib/types/retrieval";

export interface PersonaRetriever {
  getPersonaProfile(personaId: string): Promise<PersonaProfile | null>;
  retrievePersonaContext(personaId: string, query: string, topK?: number): Promise<RetrievedChunk[]>;
  buildStyleSummary(personaId: string, query: string): Promise<string | null>;
}

export class LocalPersonaRetriever implements PersonaRetriever {
  constructor(private readonly vectorStore: VectorStore = new InMemoryVectorStore()) {}

  async getPersonaProfile(personaId: string): Promise<PersonaProfile | null> {
    const persona = await dataRepository.getPersona(personaId);
    if (!persona) {
      return null;
    }

    const { sources: _sources, ...profile } = persona;
    return profile;
  }

  async retrievePersonaContext(personaId: string, query: string, topK = 3): Promise<RetrievedChunk[]> {
    const persona = await dataRepository.getPersona(personaId);
    if (!persona) {
      return [];
    }

    const documents: SearchableDocument[] = persona.sources.map((source) => ({
      id: source.id,
      sourceType: "persona",
      title: source.title,
      author: source.author,
      content: source.content,
      summary: source.summary,
      keywords: source.keywords,
      metadata: {
        personaId: persona.id,
        personaName: persona.name,
        credibility: source.credibility
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

  async buildStyleSummary(personaId: string, query: string): Promise<string | null> {
    const persona = await dataRepository.getPersona(personaId);
    if (!persona) {
      return null;
    }

    const chunks = await this.retrievePersonaContext(personaId, query, 2);
    const chunkSummary = chunks.map((chunk) => chunk.summary ?? chunk.content).join("；");
    return `${persona.styleSummary}${chunkSummary ? ` 参考侧重：${chunkSummary}` : ""}`;
  }
}