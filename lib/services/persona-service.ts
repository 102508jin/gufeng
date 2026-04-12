import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import type { PersonaProfile } from "@/lib/types/persona";

export class PersonaService {
  async listPersonas(): Promise<PersonaProfile[]> {
    const personas = await dataRepository.listPersonas();
    return personas.map(({ sources: _sources, ...profile }) => profile);
  }
}

export const personaService = new PersonaService();