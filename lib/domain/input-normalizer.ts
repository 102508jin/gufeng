import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { InputMode, NormalizedInput } from "@/lib/types/generation";
import { detectInputMode, extractKeywords, inferIntent, inferTone, normalizeWhitespace } from "@/lib/utils/text";

export interface InputNormalizer {
  normalize(input: string, mode: InputMode): Promise<NormalizedInput>;
}

export class DefaultInputNormalizer implements InputNormalizer {
  constructor(private readonly modelProvider: ModelProvider) {}

  async normalize(input: string, mode: InputMode): Promise<NormalizedInput> {
    const originalText = normalizeWhitespace(input);
    const detectedMode: NormalizedInput["detectedMode"] = mode === "auto" ? detectInputMode(originalText) : mode;

    return {
      originalText,
      detectedMode,
      normalizedQuery: originalText.replace(/[?\uFF1F]+$/u, "").trim(),
      intent: inferIntent(originalText),
      tone: inferTone(originalText),
      topics: extractKeywords(originalText)
    };
  }
}
