import type { PersonaProfile } from "@/lib/types/persona";
import type { RetrievedChunk, SourceRef } from "@/lib/types/retrieval";

export type InputMode = "auto" | "vernacular" | "classical";
export type DetectedInputMode = "vernacular" | "classical";
export type ExplanationMode = "literal" | "free" | "gloss";
export type VariantTone = "balanced" | "deliberative" | "persona";

export type GenerateRequest = {
  query: string;
  inputMode: InputMode;
  personaId?: string | null;
  providerId?: string | null;
  variantsCount: number;
  explanationModes: ExplanationMode[];
};

export type LinePair = {
  classicalSegment: string;
  vernacularSegment: string;
  notes?: string[];
};

export type VariantResult = {
  id: string;
  title: string;
  classicalText: string;
  literalExplanation?: string;
  freeExplanation?: string;
  glossExplanation?: string;
  lineByLinePairs: LinePair[];
  styleNotes?: string[];
  sources: SourceRef[];
};

export type GenerateResponse = {
  normalizedQuery: string;
  detectedInputMode: DetectedInputMode;
  persona?: PersonaProfile | null;
  variants: VariantResult[];
  retrievalRefs: RetrievedChunk[];
  debug?: {
    normalizationNotes?: string[];
    personaApplied?: boolean;
    retrievalHitCount?: number;
    provider?: string;
    providerId?: string;
  };
};

export type NormalizedInput = {
  originalText: string;
  detectedMode: DetectedInputMode;
  normalizedQuery: string;
  intent: string;
  tone: string;
  topics: string[];
};

export type GenerationContext = {
  normalized: NormalizedInput;
  persona: PersonaProfile | null;
  personaSummary: string | null;
  personaChunks: RetrievedChunk[];
  sourceChunks: RetrievedChunk[];
  variantsCount: number;
};

export type GeneratedVariantDraft = {
  title: string;
  tone: VariantTone;
  classicalText: string;
  styleNotes: string[];
};

export type ExplanationResult = {
  literalExplanation: string;
  freeExplanation: string;
  glossExplanation: string;
  lineByLinePairs: LinePair[];
};
