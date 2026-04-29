import type { AiInterventionMode, ExplanationMode, RetrievalMode, VariantTone } from "@/lib/types/generation";

export const DEFAULT_VARIANTS_COUNT = 3;
export const DEFAULT_EXPLANATION_MODES: ExplanationMode[] = ["literal", "free", "gloss"];
export const MAX_QUERY_LENGTH = 4000;
export const MAX_VARIANTS_COUNT = 4;
export const DEFAULT_MODEL_REQUEST_TIMEOUT_MS = 60_000;
export const DEFAULT_AI_INTERVENTION: AiInterventionMode = "balanced";
export const DEFAULT_RETRIEVAL_MODE: RetrievalMode = "auto";
export const RETRIEVAL_TOP_K: Record<RetrievalMode, number> = {
  off: 0,
  focused: 2,
  auto: 4,
  broad: 6
};

export const VARIANT_PRESETS: Array<{ tone: VariantTone; title: string }> = [
  { tone: "balanced", title: "\u6301\u91cd\u7248" },
  { tone: "deliberative", title: "\u7533\u8bba\u7248" },
  { tone: "persona", title: "\u89d2\u8272\u7248" }
];

export const COMMON_TOPICS = [
  "\u5b66\u4e60",
  "\u8bfb\u4e66",
  "\u8003\u8bd5",
  "\u4eba\u751f",
  "\u5904\u4e16",
  "\u670b\u53cb",
  "\u4ea4\u5f80",
  "\u60c5\u7eea",
  "\u65f6\u95f4",
  "\u81ea\u5f8b",
  "\u62d6\u5ef6",
  "\u76ee\u6807",
  "\u5fd7\u5411",
  "\u6210\u957f",
  "\u5de5\u4f5c",
  "\u9009\u62e9",
  "\u5b64\u72ec"
] as const;
