import { MAX_VARIANTS_COUNT } from "@/lib/config/constants";
import { DefaultClassicalGenerator } from "@/lib/domain/classical-generator";
import { DefaultExplanationGenerator } from "@/lib/domain/explanation-generator";
import { DefaultInputNormalizer } from "@/lib/domain/input-normalizer";
import { LocalPersonaRetriever } from "@/lib/domain/persona-retriever";
import { LocalSourceRetriever } from "@/lib/domain/source-retriever";
import { createModelProvider } from "@/lib/infra/llm/model-provider";
import type { GenerateRequest, GenerateResponse, VariantResult } from "@/lib/types/generation";
import type { RetrievedChunk, SourceRef } from "@/lib/types/retrieval";
import { createId } from "@/lib/utils/ids";
import { toExcerpt } from "@/lib/utils/text";

function toSourceRefs(chunks: RetrievedChunk[]): SourceRef[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    sourceType: chunk.sourceType,
    title: chunk.title,
    author: chunk.author,
    excerpt: toExcerpt(chunk.summary ?? chunk.content),
    score: chunk.score
  }));
}

export class GenerateService {
  private readonly modelProvider = createModelProvider();
  private readonly normalizer = new DefaultInputNormalizer(this.modelProvider);
  private readonly sourceRetriever = new LocalSourceRetriever();
  private readonly personaRetriever = new LocalPersonaRetriever();
  private readonly classicalGenerator = new DefaultClassicalGenerator(this.modelProvider);
  private readonly explanationGenerator = new DefaultExplanationGenerator(this.modelProvider);

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const variantsCount = Math.min(Math.max(request.variantsCount, 1), MAX_VARIANTS_COUNT);
    const normalized = await this.normalizer.normalize(request.query, request.inputMode);
    const persona = request.personaId
      ? await this.personaRetriever.getPersonaProfile(request.personaId)
      : null;

    const [personaChunks, personaSummary, sourceChunks] = await Promise.all([
      request.personaId ? this.personaRetriever.retrievePersonaContext(request.personaId, normalized.normalizedQuery, 3) : Promise.resolve([]),
      request.personaId ? this.personaRetriever.buildStyleSummary(request.personaId, normalized.normalizedQuery) : Promise.resolve(null),
      this.sourceRetriever.search(normalized.normalizedQuery, 4)
    ]);

    const context = {
      normalized,
      persona,
      personaSummary,
      personaChunks,
      sourceChunks,
      variantsCount
    };

    const drafts = await this.classicalGenerator.generate(context);
    const sharedSources = [...personaChunks, ...sourceChunks];

    const variants: VariantResult[] = [];
    for (const draft of drafts) {
      const explanation = await this.explanationGenerator.explain({
        draft,
        context,
        explanationModes: request.explanationModes
      });

      variants.push({
        id: createId("variant"),
        title: draft.title,
        classicalText: draft.classicalText,
        literalExplanation: explanation.literalExplanation,
        freeExplanation: explanation.freeExplanation,
        glossExplanation: explanation.glossExplanation,
        lineByLinePairs: explanation.lineByLinePairs,
        styleNotes: draft.styleNotes,
        sources: toSourceRefs(sharedSources.slice(0, 4))
      });
    }

    return {
      normalizedQuery: normalized.normalizedQuery,
      detectedInputMode: normalized.detectedMode,
      persona,
      variants,
      retrievalRefs: sharedSources,
      debug: {
        normalizationNotes: [
          `intent=${normalized.intent}`,
          `tone=${normalized.tone}`,
          `topics=${normalized.topics.join(",") || "none"}`
        ],
        personaApplied: Boolean(persona),
        retrievalHitCount: sharedSources.length,
        provider: this.modelProvider.kind
      }
    };
  }
}

export const generateService = new GenerateService();