import type { GeneratedVariantDraft, GenerationContext } from "@/lib/types/generation";

export function buildNormalizationPrompt(input: string, mode: string): string {
  return [
    "你是中文语义归一化助手。",
    `输入模式：${mode}`,
    "请将用户输入整理为简洁明确的现代汉语问句，并提炼意图、语气与主题。",
    `原始输入：${input}`
  ].join("\n");
}

export function buildGenerationPrompt(context: GenerationContext): string {
  return [
    "你是文言文回答智能体。",
    "请先理解现代汉语中间稿，再输出多个文言文回答版本。",
    `问题中间稿：${context.normalized.normalizedQuery}`,
    `主题：${context.normalized.topics.join("、") || "未标注"}`,
    context.persona ? `人物风格：${context.persona.name}。${context.personaSummary ?? context.persona.styleSummary}` : "人物风格：无",
    `知识片段：${context.sourceChunks.map((chunk) => `${chunk.title}：${chunk.summary ?? chunk.content}`).join(" | ")}`,
    `输出数量：${context.variantsCount}`
  ].join("\n");
}

export function buildExplanationPrompt(variant: GeneratedVariantDraft, normalizedQuery: string): string {
  return [
    "你是文言文解析助手。",
    `原始现代汉语问题：${normalizedQuery}`,
    `待解析文言文：${variant.classicalText}`,
    "请输出逐句解析、意译解析与关键词注释。"
  ].join("\n");
}