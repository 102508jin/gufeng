import { z } from "zod";

import { buildExplanationPrompt } from "@/lib/domain/prompt-builder";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { ExplanationMode, ExplanationResult, GeneratedVariantDraft, GenerationContext, LinePair } from "@/lib/types/generation";
import { splitChineseSentences } from "@/lib/utils/text";

const explanationSchema = z.object({
  literalExplanation: z.string().min(1),
  freeExplanation: z.string().min(1),
  glossExplanation: z.string().min(1),
  lineByLinePairs: z.array(
    z.object({
      classicalSegment: z.string().min(1),
      vernacularSegment: z.string().min(1),
      notes: z.array(z.string()).optional()
    })
  )
});

const REVERSE_REPLACEMENTS: Array<[string, string]> = [
  ["\u543e\u8f88", "\u6211\u4eec"],
  ["\u5176\u5fc3", "\u5185\u5fc3"],
  ["\u4f55\u4ee5", "\u4e3a\u4ec0\u4e48"],
  ["\u82e5\u4f55", "\u5982\u4f55"],
  ["\u6cbb\u5b66", "\u5b66\u4e60"],
  ["\u53cb\u670b", "\u670b\u53cb"],
  ["\u5bf8\u9634", "\u65f6\u95f4"],
  ["\u6301\u6052", "\u575a\u6301"],
  ["\u52e4\u52c9", "\u52aa\u529b"],
  ["\u6240\u5411", "\u76ee\u6807"],
  ["\u5176\u6cd5", "\u65b9\u6cd5"],
  ["\u5176\u4e8b", "\u4e8b\u60c5"],
  ["\u6bcb", "\u4e0d\u8981"],
  ["\u4e0d\u53ef", "\u4e0d\u80fd"],
  ["\u7b03\u884c", "\u5207\u5b9e\u53bb\u505a"],
  ["\u5373\u8d77\u800c\u884c", "\u9a6c\u4e0a\u884c\u52a8"],
  ["\u65e5\u7701", "\u6bcf\u65e5\u53cd\u7701"],
  ["\u7acb\u5fd7", "\u7acb\u4e0b\u5fd7\u5411"]
];

const text = {
  removePrefixPattern: /^(?:\u592b|\u76d6|\u5b50\u66f0\uff1a|\u4eae\u4ee5\u4e3a\uff1a|\u4f59\u8c13\uff1a|\u7b54\u66f0\uff1a)/u,
  noteGai: "\u201c\u76d6\u201d\u5e38\u7528\u6765\u5f15\u51fa\u5224\u65ad\u6216\u7533\u8bba\u3002",
  noteFu: "\u201c\u592b\u201d\u591a\u4f5c\u8d77\u53e5\u53d1\u7aef\uff0c\u4f7f\u8bed\u52bf\u66f4\u7a33\u3002",
  noteWu: "\u201c\u6bcb\u201d\u5373\u201c\u4e0d\u8981\u201d\uff0c\u8bed\u6c14\u8f83\u7b80\u52b2\u3002",
  noteZhi: "\u201c\u5fd7\u201d\u591a\u6307\u5fd7\u5411\u3001\u5b9a\u5411\u4e4b\u5fc3\u3002",
  freePrefix: "\u3002\u5927\u610f\u662f\uff1a",
  separator: "\uff1b",
  fallbackGloss: "\u591a\u7528\u7b80\u7ec3\u865a\u8bcd\u548c\u529d\u52c9\u6027\u8bcd\u8bed\uff0c\u4f7f\u7b54\u8bed\u66f4\u6709\u6587\u8a00\u6c14\u606f\u3002"
} as const;

function vernacularizeSegment(segment: string): string {
  let output = segment.replace(text.removePrefixPattern, "").trim();
  for (const [from, to] of REVERSE_REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function buildNotes(segment: string): string[] {
  const notes: string[] = [];
  if (segment.includes("\u76d6")) {
    notes.push(text.noteGai);
  }
  if (segment.includes("\u592b")) {
    notes.push(text.noteFu);
  }
  if (segment.includes("\u6bcb")) {
    notes.push(text.noteWu);
  }
  if (segment.includes("\u5fd7")) {
    notes.push(text.noteZhi);
  }
  return notes;
}

function buildFallbackExplanation(draft: GeneratedVariantDraft, normalizedQuery: string): ExplanationResult {
  const segments = splitChineseSentences(draft.classicalText);
  const lineByLinePairs: LinePair[] = segments.map((segment) => ({
    classicalSegment: segment,
    vernacularSegment: vernacularizeSegment(segment),
    notes: buildNotes(segment)
  }));

  const literalExplanation = lineByLinePairs.map((pair) => pair.vernacularSegment).join(text.separator);
  const freeExplanation = `${normalizedQuery}${text.freePrefix}${lineByLinePairs
    .map((pair) => pair.vernacularSegment)
    .join(text.separator)}\u3002`;
  const glossExplanation =
    lineByLinePairs
      .flatMap((pair) => pair.notes ?? [])
      .filter(Boolean)
      .join(text.separator) || text.fallbackGloss;

  return {
    literalExplanation,
    freeExplanation,
    glossExplanation,
    lineByLinePairs
  };
}

export interface ExplanationGenerator {
  explain(params: {
    draft: GeneratedVariantDraft;
    context: GenerationContext;
    explanationModes: ExplanationMode[];
  }): Promise<ExplanationResult>;
}

export class DefaultExplanationGenerator implements ExplanationGenerator {
  constructor(private readonly modelProvider: ModelProvider) {}

  async explain(params: {
    draft: GeneratedVariantDraft;
    context: GenerationContext;
    explanationModes: ExplanationMode[];
  }): Promise<ExplanationResult> {
    if (this.modelProvider.kind !== "mock") {
      try {
        return await this.modelProvider.generateStructured(
          buildExplanationPrompt(params.draft, params.context.normalized.normalizedQuery),
          explanationSchema,
          { temperature: 0.4 }
        );
      } catch {
        return buildFallbackExplanation(params.draft, params.context.normalized.normalizedQuery);
      }
    }

    return buildFallbackExplanation(params.draft, params.context.normalized.normalizedQuery);
  }
}
