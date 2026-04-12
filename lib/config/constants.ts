import type { ExplanationMode, VariantTone } from "@/lib/types/generation";

export const DEFAULT_VARIANTS_COUNT = 3;
export const DEFAULT_EXPLANATION_MODES: ExplanationMode[] = ["literal", "free", "gloss"];
export const MAX_VARIANTS_COUNT = 4;

export const VARIANT_PRESETS: Array<{ tone: VariantTone; title: string }> = [
  { tone: "balanced", title: "Balanced Classical" },
  { tone: "deliberative", title: "Deliberative Classical" },
  { tone: "persona", title: "Persona Style" }
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