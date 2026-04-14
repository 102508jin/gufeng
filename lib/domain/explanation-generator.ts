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
  ["吾辈", "我们"],
  ["其心", "内心"],
  ["何以", "为什么"],
  ["若何", "如何"],
  ["当", "应当"],
  ["毋", "不要"],
  ["不可", "不能"],
  ["治学", "学习"],
  ["友朋", "朋友"],
  ["寸阴", "时间"],
  ["持恒", "坚持"],
  ["勤勉", "努力"],
  ["所向", "目标"],
  ["其法", "方法"],
  ["其事", "事情"],
  ["志", "志向"],
  ["慎思", "慎重思考"],
  ["笃行", "确实去做"],
  ["守", "守住"],
  ["省", "反省"],
  ["立即起行", "马上开始行动"]
];

function vernacularizeSegment(segment: string): string {
  let output = segment.replace(/^(?:夫|盖|子曰：|亮以为：|余谓：|答曰：)/u, "").trim();
  for (const [from, to] of REVERSE_REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function buildNotes(segment: string): string[] {
  const notes: string[] = [];
  if (segment.includes("盖")) {
    notes.push("盖: introduces a reasoned judgement.");
  }
  if (segment.includes("夫")) {
    notes.push("夫: a sentence-opening particle for argument.");
  }
  if (segment.includes("毋")) {
    notes.push("毋: do not.");
  }
  if (segment.includes("志")) {
    notes.push("志: aspiration or settled direction.");
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

  const literalExplanation = lineByLinePairs.map((pair) => pair.vernacularSegment).join(" ");
  const freeExplanation = `${normalizedQuery} ${lineByLinePairs.map((pair) => pair.vernacularSegment).join("；")}`;
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
