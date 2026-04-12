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
  ["\u5f53", "\u5e94\u5f53"],
  ["\u6bcb", "\u4e0d\u8981"],
  ["\u4e0d\u53ef", "\u4e0d\u80fd"],
  ["\u6cbb\u5b66", "\u5b66\u4e60"],
  ["\u53cb\u670b", "\u670b\u53cb"],
  ["\u5bf8\u9634", "\u65f6\u95f4"],
  ["\u6301\u6052", "\u575a\u6301"],
  ["\u52e4\u52c9", "\u52aa\u529b"],
  ["\u6240\u5411", "\u76ee\u6807"],
  ["\u5176\u6cd5", "\u65b9\u6cd5"],
  ["\u5176\u4e8b", "\u4e8b\u60c5"],
  ["\u5fd7", "\u5fd7\u5411"],
  ["\u614e\u601d", "\u614e\u91cd\u601d\u8003"],
  ["\u7b03\u884c", "\u786e\u5b9e\u53bb\u505a"],
  ["\u5b88", "\u5b88\u4f4f"],
  ["\u7701", "\u53cd\u7701"],
  ["\u7acb\u5373\u8d77\u884c", "\u9a6c\u4e0a\u5f00\u59cb\u884c\u52a8"]
];

function vernacularizeSegment(segment: string): string {
  let output = segment.replace(/^(?:\u592b|\u76d6|\u5b50\u66f0\uff1a|\u4eae\u4ee5\u4e3a\uff1a|\u4f59\u8c13\uff1a|\u7b54\u66f0\uff1a)/u, "").trim();
  for (const [from, to] of REVERSE_REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function buildNotes(segment: string): string[] {
  const notes: string[] = [];
  if (segment.includes("\u76d6")) {
    notes.push("\u76d6: introduces a reasoned judgement.");
  }
  if (segment.includes("\u592b")) {
    notes.push("\u592b: a sentence-opening particle for argument. ");
  }
  if (segment.includes("\u6bcb")) {
    notes.push("\u6bcb: do not.");
  }
  if (segment.includes("\u5fd7")) {
    notes.push("\u5fd7: aspiration or settled direction.");
  }
  return notes.map((note) => note.trim());
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
      return this.modelProvider.generateStructured(
        buildExplanationPrompt(params.draft, params.context.normalized.normalizedQuery),
        explanationSchema,
        { temperature: 0.4 }
      );
    }

    const segments = splitChineseSentences(params.draft.classicalText);
    const lineByLinePairs: LinePair[] = segments.map((segment) => ({
      classicalSegment: segment,
      vernacularSegment: vernacularizeSegment(segment),
      notes: buildNotes(segment)
    }));

    const literalExplanation = lineByLinePairs.map((pair) => pair.vernacularSegment).join(" ");
    const freeExplanation = `${params.context.normalized.normalizedQuery}。${lineByLinePairs
      .map((pair) => pair.vernacularSegment)
      .join("；")}`;
    const glossExplanation = lineByLinePairs
      .flatMap((pair) => pair.notes ?? [])
      .filter(Boolean)
      .join("；") || "Uses compact classical particles and advisory vocabulary.";

    return {
      literalExplanation,
      freeExplanation,
      glossExplanation,
      lineByLinePairs
    };
  }
}