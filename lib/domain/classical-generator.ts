import { z } from "zod";

import { VARIANT_PRESETS } from "@/lib/config/constants";
import { buildGenerationPrompt } from "@/lib/domain/prompt-builder";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { GeneratedVariantDraft, GenerationContext, VariantTone } from "@/lib/types/generation";
import { classicalizeText, draftModernAnswer } from "@/lib/utils/text";

const variantsSchema = z.array(
  z.object({
    title: z.string().min(1),
    tone: z.enum(["balanced", "deliberative", "persona"]),
    classicalText: z.string().min(1),
    styleNotes: z.array(z.string())
  })
);

const text = {
  period: "\u3002",
  genericPrefix: "\u7b54\u66f0\uff1a",
  confuciusPrefix: "\u5b50\u66f0\uff1a",
  zhugePrefix: "\u4eae\u4ee5\u4e3a\uff1a",
  taoPrefix: "\u4f59\u8c13\uff1a",
  noPersona: "\u672a\u6307\u5b9a\u89d2\u8272\uff0c\u91c7\u7528\u901a\u7528\u6587\u8a00\u8bed\u6c14\u3002",
  confuciusNote: "\u91c7\u7528\u5b54\u5b50\u5f0f\u6e29\u539a\u529d\u52c9\u8bed\u6c14\u3002",
  zhugeNote: "\u91c7\u7528\u8bf8\u845b\u4eae\u5f0f\u7b79\u5212\u5206\u660e\u8bed\u6c14\u3002",
  taoNote: "\u91c7\u7528\u9676\u6e0a\u660e\u5f0f\u5e73\u6de1\u758f\u6717\u8bed\u6c14\u3002",
  balancedPrefix: "\u592b",
  deliberativePrefix: "\u76d6",
  balancedNote: "\u8bed\u6c14\u51dd\u7ec3\uff0c\u91cd\u5728\u529d\u52c9\u3002",
  deliberativeNote: "\u5c42\u5c42\u7533\u8bf4\uff0c\u5f3a\u8c03\u56e0\u679c\u4e0e\u6b21\u7b2c\u3002",
  personaSuffix: "\u98ce\u683c\u7248"
} as const;

export interface ClassicalGenerator {
  generate(context: GenerationContext): Promise<GeneratedVariantDraft[]>;
}

function joinAsClassical(lines: string[], prefix: string): string {
  const body = lines
    .map((line) => classicalizeText(line))
    .filter(Boolean)
    .join(text.period);

  return `${prefix}${body}`
    .replace(/\u3002\u3002+/gu, text.period)
    .replace(/^\u3002/u, "")
    .replace(/\u3002$/u, "")
    .concat(text.period);
}

function buildPersonaStyledText(lines: string[], context: GenerationContext): { text: string; notes: string[] } {
  if (!context.persona) {
    return {
      text: joinAsClassical(lines, text.genericPrefix),
      notes: [text.noPersona]
    };
  }

  switch (context.persona.id) {
    case "kongzi":
      return {
        text: joinAsClassical(lines, text.confuciusPrefix),
        notes: [text.confuciusNote, context.persona.styleSummary]
      };
    case "zhuge-liang":
      return {
        text: joinAsClassical(lines, text.zhugePrefix),
        notes: [text.zhugeNote, context.persona.styleSummary]
      };
    case "tao-yuanming":
      return {
        text: joinAsClassical(lines, text.taoPrefix),
        notes: [text.taoNote, context.persona.styleSummary]
      };
    default:
      return {
        text: joinAsClassical(lines, text.genericPrefix),
        notes: [context.persona.styleSummary]
      };
  }
}

function buildDeterministicVariants(context: GenerationContext): GeneratedVariantDraft[] {
  const lines = draftModernAnswer(context.normalized.normalizedQuery, context.normalized.topics);
  const selectedPresets = VARIANT_PRESETS.slice(0, Math.max(1, context.variantsCount));

  return selectedPresets.map((preset) => {
    if (preset.tone === "balanced") {
      return {
        title: preset.title,
        tone: preset.tone,
        classicalText: joinAsClassical(lines, text.balancedPrefix),
        styleNotes: [text.balancedNote]
      };
    }

    if (preset.tone === "deliberative") {
      return {
        title: preset.title,
        tone: preset.tone,
        classicalText: joinAsClassical(lines, text.deliberativePrefix),
        styleNotes: [text.deliberativeNote]
      };
    }

    const personaStyled = buildPersonaStyledText(lines, context);
    return {
      title: context.persona ? `${context.persona.name}${text.personaSuffix}` : preset.title,
      tone: preset.tone,
      classicalText: personaStyled.text,
      styleNotes: personaStyled.notes
    };
  });
}

function mapTone(value: string | undefined, fallback: VariantTone): VariantTone {
  if (value === "balanced" || value === "deliberative" || value === "persona") {
    return value;
  }
  return fallback;
}

function buildPlainTextFallbackPrompt(context: GenerationContext): string {
  const personaLine = context.persona
    ? `${context.persona.name} | ${context.personaSummary ?? context.persona.styleSummary}`
    : "none";

  return [
    `Generate exactly ${context.variantsCount} classical Chinese answer variants.`,
    "Do not return JSON.",
    "Use this exact plain-text format for every variant:",
    "### VARIANT 1",
    "TITLE: <short modern Chinese title>",
    "TONE: <balanced|deliberative|persona>",
    "TEXT: <one classical Chinese answer paragraph>",
    "NOTES: <note 1 | note 2>",
    "",
    "Requirements:",
    "- TEXT must be classical Chinese.",
    "- TITLE and NOTES must be modern Chinese.",
    "- Do not use markdown tables.",
    "- Do not add any content outside the specified format.",
    "",
    `Question: ${context.normalized.normalizedQuery}`,
    `Topics: ${context.normalized.topics.join(", ") || "none"}`,
    `Persona: ${personaLine}`
  ].join("\n");
}

function parsePlainTextVariants(input: string, context: GenerationContext): GeneratedVariantDraft[] {
  const deterministic = buildDeterministicVariants(context);
  const sections = input
    .split(/###\s*VARIANT\s+\d+/giu)
    .map((section) => section.trim())
    .filter(Boolean);

  const parsed = sections.map((section, index) => {
    const fallback = deterministic[index] ?? deterministic[deterministic.length - 1];
    const title = section.match(/^TITLE:\s*(.+)$/imu)?.[1]?.trim() ?? fallback.title;
    const tone = mapTone(section.match(/^TONE:\s*(.+)$/imu)?.[1]?.trim(), fallback.tone);
    const textBody = section.match(/^TEXT:\s*([\s\S]*?)(?:\nNOTES:|$)/imu)?.[1]?.trim() ?? fallback.classicalText;
    const notesRaw = section.match(/^NOTES:\s*(.+)$/imu)?.[1]?.trim();
    const styleNotes = notesRaw
      ? notesRaw.split("|").map((note) => note.trim()).filter(Boolean)
      : fallback.styleNotes;

    return {
      title,
      tone,
      classicalText: textBody.endsWith(text.period) ? textBody : `${textBody}${text.period}`,
      styleNotes
    };
  });

  if (!parsed.length) {
    return deterministic;
  }

  while (parsed.length < context.variantsCount) {
    parsed.push(deterministic[parsed.length] ?? deterministic[deterministic.length - 1]);
  }

  return parsed.slice(0, context.variantsCount);
}

export class DefaultClassicalGenerator implements ClassicalGenerator {
  constructor(private readonly modelProvider: ModelProvider) {}

  async generate(context: GenerationContext): Promise<GeneratedVariantDraft[]> {
    if (this.modelProvider.kind !== "mock") {
      try {
        return await this.modelProvider.generateStructured(buildGenerationPrompt(context), variantsSchema, {
          temperature: 0.7
        });
      } catch {
        try {
          const textResponse = await this.modelProvider.generateText(buildPlainTextFallbackPrompt(context), {
            temperature: 0.5
          });
          return parsePlainTextVariants(textResponse, context);
        } catch {
          return buildDeterministicVariants(context);
        }
      }
    }

    return buildDeterministicVariants(context);
  }
}
