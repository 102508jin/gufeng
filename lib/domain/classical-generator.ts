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

export interface ClassicalGenerator {
  generate(context: GenerationContext): Promise<GeneratedVariantDraft[]>;
}

function joinAsClassical(lines: string[], prefix: string): string {
  return `${prefix}${lines.map((line) => classicalizeText(line)).join("。")}`
    .replace(/。。+/gu, "。")
    .replace(/。$/u, "")
    .concat("。");
}

function buildPersonaStyledText(lines: string[], context: GenerationContext): { text: string; notes: string[] } {
  if (!context.persona) {
    return {
      text: joinAsClassical(lines, "答曰："),
      notes: ["No persona selected; using a generic classical tone."]
    };
  }

  switch (context.persona.id) {
    case "kongzi":
      return {
        text: joinAsClassical(lines, "子曰："),
        notes: ["Modeled with a Confucian didactic cadence.", context.persona.styleSummary]
      };
    case "zhuge-liang":
      return {
        text: joinAsClassical(lines, "亮以为："),
        notes: ["Modeled with Zhuge Liang style planning language.", context.persona.styleSummary]
      };
    case "tao-yuanming":
      return {
        text: joinAsClassical(lines, "余谓："),
        notes: ["Modeled with Tao Yuanming style calm distance.", context.persona.styleSummary]
      };
    default:
      return {
        text: joinAsClassical(lines, "答曰："),
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
        classicalText: joinAsClassical(lines, "夫"),
        styleNotes: ["Compact exhortative style."]
      };
    }

    if (preset.tone === "deliberative") {
      return {
        title: preset.title,
        tone: preset.tone,
        classicalText: joinAsClassical(lines, "盖"),
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
    const text = section.match(/^TEXT:\s*([\s\S]*?)(?:\nNOTES:|$)/imu)?.[1]?.trim() ?? fallback.classicalText;
    const notesRaw = section.match(/^NOTES:\s*(.+)$/imu)?.[1]?.trim();
    const styleNotes = notesRaw
      ? notesRaw.split("|").map((note) => note.trim()).filter(Boolean)
      : fallback.styleNotes;

    return {
      title,
      tone,
      classicalText: text.endsWith("。") ? text : `${text}。`,
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
          const text = await this.modelProvider.generateText(buildPlainTextFallbackPrompt(context), {
            temperature: 0.5
          });
          return parsePlainTextVariants(text, context);
        } catch {
          return buildDeterministicVariants(context);
        }
      }
    }

    return buildDeterministicVariants(context);
  }
}
