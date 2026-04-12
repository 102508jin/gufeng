import { z } from "zod";

import { buildNormalizationPrompt } from "@/lib/domain/prompt-builder";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { InputMode, NormalizedInput } from "@/lib/types/generation";
import { detectInputMode, extractKeywords, inferIntent, inferTone, normalizeWhitespace } from "@/lib/utils/text";

const normalizedInputSchema = z.object({
  detectedMode: z.enum(["vernacular", "classical"]),
  normalizedQuery: z.string().min(1),
  intent: z.string().min(1),
  tone: z.string().min(1),
  topics: z.array(z.string())
});

export interface InputNormalizer {
  normalize(input: string, mode: InputMode): Promise<NormalizedInput>;
}

export class DefaultInputNormalizer implements InputNormalizer {
  constructor(private readonly modelProvider: ModelProvider) {}

  async normalize(input: string, mode: InputMode): Promise<NormalizedInput> {
    const originalText = normalizeWhitespace(input);
    const detectedMode: NormalizedInput["detectedMode"] = mode === "auto" ? detectInputMode(originalText) : mode;

    if (this.modelProvider.kind !== "mock") {
      const structured = await this.modelProvider.generateStructured(
        buildNormalizationPrompt(originalText, mode),
        normalizedInputSchema,
        { temperature: 0.2 }
      );

      return {
        originalText,
        ...structured
      };
    }

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