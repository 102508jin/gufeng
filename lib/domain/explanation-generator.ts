import { z } from "zod";

import { buildExplanationPrompt } from "@/lib/domain/prompt-builder";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import type { ExplanationMode, ExplanationResult, GeneratedVariantDraft, GenerationContext, LinePair } from "@/lib/types/generation";
import { draftModernAnswer, splitChineseSentences } from "@/lib/utils/text";

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
  ["治学", "学习"],
  ["友朋", "朋友"],
  ["寸阴", "时间"],
  ["持恒", "坚持"],
  ["勤勉", "努力"],
  ["所向", "目标"],
  ["其法", "方法"],
  ["其事", "事情"],
  ["毋", "不要"],
  ["不可", "不能"],
  ["笃行", "切实去做"],
  ["即起而行", "马上行动"],
  ["日省", "每日反省"],
  ["立志", "立下志向"]
];

const text = {
  removePrefixPattern: /^(?:夫|盖|子曰：|亮以为：|余谓：|答曰：)/u,
  noteGai: "“盖”常用来引出判断或申论。",
  noteFu: "“夫”多作起句发端，使语势更稳。",
  noteWu: "“毋”即“不要”，语气较简劲。",
  noteZhi: "“志”多指志向、定向之心。",
  freePrefix: "。大意是：",
  separator: "；",
  fallbackGloss: "多用简练虚词和劝勉性词语，使答语更有文言气息。"
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
  if (segment.includes("盖")) {
    notes.push(text.noteGai);
  }
  if (segment.includes("夫")) {
    notes.push(text.noteFu);
  }
  if (segment.includes("毋")) {
    notes.push(text.noteWu);
  }
  if (segment.includes("志")) {
    notes.push(text.noteZhi);
  }
  return notes;
}

function isStandalonePunctuation(value: string): boolean {
  return /^[。；，、！？：]+$/u.test(value.trim());
}

function buildFallbackExplanation(draft: GeneratedVariantDraft, context: GenerationContext): ExplanationResult {
  const segments = splitChineseSentences(draft.classicalText).filter((segment) => !isStandalonePunctuation(segment));
  const modernLines = draftModernAnswer(context.normalized.normalizedQuery, context.normalized.topics);

  const lineByLinePairs: LinePair[] = segments.map((segment, index) => ({
    classicalSegment: segment,
    vernacularSegment: modernLines[index] ?? vernacularizeSegment(segment),
    notes: buildNotes(segment)
  }));

  const literalExplanation = lineByLinePairs.map((pair) => pair.vernacularSegment).join(text.separator);
  const freeExplanation = `${context.normalized.normalizedQuery}${text.freePrefix}${lineByLinePairs
    .map((pair) => pair.vernacularSegment)
    .join("")}`;
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
        return buildFallbackExplanation(params.draft, params.context);
      }
    }

    return buildFallbackExplanation(params.draft, params.context);
  }
}
