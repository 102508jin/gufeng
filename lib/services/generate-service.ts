import {
  DEFAULT_AI_INTERVENTION,
  DEFAULT_RETRIEVAL_MODE,
  MAX_VARIANTS_COUNT,
  RETRIEVAL_TOP_K
} from "@/lib/config/constants";
import { DefaultClassicalGenerator } from "@/lib/domain/classical-generator";
import { DefaultExplanationGenerator } from "@/lib/domain/explanation-generator";
import { DefaultInputNormalizer } from "@/lib/domain/input-normalizer";
import { LocalPersonaRetriever } from "@/lib/domain/persona-retriever";
import { LocalSourceRetriever } from "@/lib/domain/source-retriever";
import { createModelProvider } from "@/lib/infra/llm/model-provider";
import { logger } from "@/lib/infra/logger";
import { resolveModelProfile } from "@/lib/infra/llm/provider-registry";
import type { GenerateRequest, GenerateResponse, UserContext, VariantResult } from "@/lib/types/generation";
import type { ModelProfile } from "@/lib/types/provider";
import type { RetrievedChunk } from "@/lib/types/retrieval";
import { createId } from "@/lib/utils/ids";
import { toSourceRef } from "@/lib/utils/retrieval";

function formatIntent(intent: string): string {
  switch (intent) {
    case "advice":
      return "\u6c42\u7b56";
    case "judgement":
      return "\u5224\u65ad";
    case "reflection":
      return "\u7701\u601d";
    case "planning":
      return "\u7b79\u5212";
    default:
      return intent;
  }
}

function formatTone(tone: string): string {
  switch (tone) {
    case "measured":
      return "\u5e73\u5b9e";
    case "soothing":
      return "\u5bbd\u6170";
    case "instructive":
      return "\u529d\u52c9";
    case "urgent":
      return "\u5207\u76f4";
    default:
      return tone;
  }
}

function formatProvider(provider: string): string {
  switch (provider) {
    case "ollama":
      return "\u672c\u5730 Ollama";
    case "openai":
    case "openai-compatible":
      return "OpenAI \u63a5\u53e3";
    case "anthropic":
      return "Claude / Anthropic";
    case "mock":
      return "\u6f14\u793a\u6a21\u5f0f";
    default:
      return provider;
  }
}

function cleanOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeUserContext(userContext?: UserContext | null): UserContext | null {
  if (!userContext) {
    return null;
  }

  const normalized = {
    displayName: cleanOptionalText(userContext.displayName),
    useCase: cleanOptionalText(userContext.useCase),
    preference: cleanOptionalText(userContext.preference)
  };

  return normalized.displayName || normalized.useCase || normalized.preference ? normalized : null;
}

export class GenerateService {
  private readonly sourceRetriever = new LocalSourceRetriever();
  private readonly personaRetriever = new LocalPersonaRetriever();

  constructor(
    private readonly resolveProfile = resolveModelProfile,
    private readonly makeModelProvider = createModelProvider
  ) {}

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const profile = this.resolveProfile(request.providerId);
    try {
      return await this.generateWithProfile(request, profile);
    } catch (error) {
      if (profile.driver === "mock") {
        throw error;
      }

      const fallbackProfile: ModelProfile = {
        id: "mock",
        label: "\u6f14\u793a\u6a21\u5f0f",
        driver: "mock"
      };
      const fallbackReason = error instanceof Error ? error.message : String(error);
      logger.warn("Primary model provider failed, falling back to mock provider.", {
        providerId: profile.id,
        error: fallbackReason
      });

      return this.generateWithProfile(request, fallbackProfile, {
        primaryProviderId: profile.id,
        fallbackReason
      });
    }
  }

  private async generateWithProfile(
    request: GenerateRequest,
    profile: ModelProfile,
    fallback?: {
      primaryProviderId: string;
      fallbackReason: string;
    }
  ): Promise<GenerateResponse> {
    const modelProvider = this.makeModelProvider(profile);
    const normalizer = new DefaultInputNormalizer(modelProvider);
    const classicalGenerator = new DefaultClassicalGenerator(modelProvider);
    const explanationGenerator = new DefaultExplanationGenerator(modelProvider);
    const variantsCount = Math.min(Math.max(request.variantsCount, 1), MAX_VARIANTS_COUNT);
    const aiIntervention = request.aiIntervention ?? DEFAULT_AI_INTERVENTION;
    const retrievalMode = request.retrievalMode ?? DEFAULT_RETRIEVAL_MODE;
    const sourceTopK = RETRIEVAL_TOP_K[retrievalMode] ?? RETRIEVAL_TOP_K[DEFAULT_RETRIEVAL_MODE];
    const userContext = normalizeUserContext(request.userContext);
    const normalized = await normalizer.normalize(request.query, request.inputMode);
    const persona = request.personaId
      ? await this.personaRetriever.getPersonaProfile(request.personaId)
      : null;

    const [personaChunks, personaSummary, sourceChunks] = await Promise.all([
      request.personaId ? this.personaRetriever.retrievePersonaContext(request.personaId, normalized.normalizedQuery, 3) : Promise.resolve([]),
      request.personaId ? this.personaRetriever.buildStyleSummary(request.personaId, normalized.normalizedQuery) : Promise.resolve(null),
      sourceTopK > 0 ? this.sourceRetriever.search(normalized.normalizedQuery, sourceTopK) : Promise.resolve([])
    ]);

    const context = {
      normalized,
      persona,
      personaSummary,
      personaChunks,
      sourceChunks,
      variantsCount,
      aiIntervention,
      retrievalMode,
      userContext
    };

    const drafts = await classicalGenerator.generate(context);
    const sharedSources = [...personaChunks, ...sourceChunks];

    const variants: VariantResult[] = [];
    for (const draft of drafts) {
      const explanation = await explanationGenerator.explain({
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
        sources: sharedSources.slice(0, 4).map(toSourceRef)
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
          `\u610f\u56fe\uff1a${formatIntent(normalized.intent)}`,
          `\u8bed\u6c14\uff1a${formatTone(normalized.tone)}`,
          `\u4e3b\u9898\uff1a${normalized.topics.join("\u3001") || "\u672a\u8bc6\u522b"}`
        ],
        personaApplied: Boolean(persona),
        retrievalHitCount: sharedSources.length,
        provider: profile.label || formatProvider(modelProvider.kind),
        providerId: profile.id,
        primaryProviderId: fallback?.primaryProviderId ?? profile.id,
        fallbackProviderId: fallback ? profile.id : undefined,
        fallbackReason: fallback?.fallbackReason,
        aiIntervention,
        retrievalMode,
        userContextApplied: Boolean(userContext)
      }
    };
  }
}

export const generateService = new GenerateService();
