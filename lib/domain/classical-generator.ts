import { z } from "zod";

import { VARIANT_PRESETS } from "@/lib/config/constants";
import { buildGenerationPrompt } from "@/lib/domain/prompt-builder";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { GeneratedVariantDraft, GenerationContext } from "@/lib/types/generation";
import { classicalizeText, draftModernAnswer } from "@/lib/utils/text";

const variantsSchema = z.array(
  z.object({
    title: z.string().min(1),
    tone: z.enum(["balanced", "deliberative", "persona"]),
    classicalText: z.string().min(1),
    styleNotes: z.array(z.string())
  })
);

export interface ClassicalGenerator {
  generate(context: GenerationContext): Promise<GeneratedVariantDraft[]>;
}

function joinAsClassical(lines: string[], prefix: string): string {
  return `${prefix}${lines.map((line) => classicalizeText(line)).join("\u3002")}`
    .replace(/\u3002\u3002+/gu, "\u3002")
    .replace(/\u3002$/u, "")
    .concat("\u3002");
}

function buildPersonaStyledText(lines: string[], context: GenerationContext): { text: string; notes: string[] } {
  if (!context.persona) {
    return {
      text: joinAsClassical(lines, "\u7b54\u66f0\uff1a"),
      notes: ["No persona selected; using a generic classical tone."]
    };
  }

  switch (context.persona.id) {
    case "kongzi":
      return {
        text: joinAsClassical(lines, "\u5b50\u66f0\uff1a"),
        notes: ["Modeled with a Confucian didactic cadence.", context.persona.styleSummary]
      };
    case "zhuge-liang":
      return {
        text: joinAsClassical(lines, "\u4eae\u4ee5\u4e3a\uff1a"),
        notes: ["Modeled with Zhuge Liang style planning language.", context.persona.styleSummary]
      };
    case "tao-yuanming":
      return {
        text: joinAsClassical(lines, "\u4f59\u8c13\uff1a"),
        notes: ["Modeled with Tao Yuanming style calm distance.", context.persona.styleSummary]
      };
    default:
      return {
        text: joinAsClassical(lines, "\u7b54\u66f0\uff1a"),
        notes: [context.persona.styleSummary]
      };
  }
}

export class DefaultClassicalGenerator implements ClassicalGenerator {
  constructor(private readonly modelProvider: ModelProvider) {}

  async generate(context: GenerationContext): Promise<GeneratedVariantDraft[]> {
    if (this.modelProvider.kind !== "mock") {
      return this.modelProvider.generateStructured(buildGenerationPrompt(context), variantsSchema, {
        temperature: 0.7
      });
    }

    const lines = draftModernAnswer(context.normalized.normalizedQuery, context.normalized.topics);
    const selectedPresets = VARIANT_PRESETS.slice(0, Math.max(1, context.variantsCount));

    return selectedPresets.map((preset) => {
      if (preset.tone === "balanced") {
        return {
          title: preset.title,
          tone: preset.tone,
          classicalText: joinAsClassical(lines, "\u592b"),
          styleNotes: ["Compact exhortative style."]
        };
      }

      if (preset.tone === "deliberative") {
        return {
          title: preset.title,
          tone: preset.tone,
          classicalText: joinAsClassical(lines, "\u76d6"),
          styleNotes: ["Expanded argument with causal progression."]
        };
      }

      const personaStyled = buildPersonaStyledText(lines, context);
      return {
        title: context.persona ? `${context.persona.name} Style` : preset.title,
        tone: preset.tone,
        classicalText: personaStyled.text,
        styleNotes: personaStyled.notes
      };
    });
  }
}