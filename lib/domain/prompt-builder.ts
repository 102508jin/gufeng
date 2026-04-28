import type { GeneratedVariantDraft, GenerationContext } from "@/lib/types/generation";

function formatSourceBlock(context: GenerationContext): string {
  if (context.retrievalMode === "off") {
    return "- Knowledge retrieval is disabled for this request.";
  }

  if (!context.sourceChunks.length) {
    return "- No external supporting snippets were retrieved.";
  }

  return context.sourceChunks
    .map((chunk) => `- ${chunk.title}: ${chunk.summary ?? chunk.content}`)
    .join("\n");
}

function formatUserContextBlock(context: GenerationContext): string {
  if (!context.userContext) {
    return "none";
  }

  const items = [
    context.userContext.displayName ? `Name: ${context.userContext.displayName}` : null,
    context.userContext.useCase ? `Use case: ${context.userContext.useCase}` : null,
    context.userContext.preference ? `Preference: ${context.userContext.preference}` : null
  ].filter(Boolean);

  return items.length ? items.join("\n") : "none";
}

function formatAiInterventionGuide(context: GenerationContext): string {
  switch (context.aiIntervention) {
    case "conservative":
      return "Stay close to the question and retrieved sources. Prefer compact, cautious advice and avoid adding new claims.";
    case "creative":
      return "Use richer rhetoric and more distinctive structure while staying useful. Do not invent fake citations or claims.";
    default:
      return "Balance practical reasoning with the retrieved sources. Keep the answer polished but not over-styled.";
  }
}

export function buildNormalizationPrompt(input: string, mode: string): string {
  return [
    "You normalize Chinese user queries for a classical-Chinese answering assistant.",
    "The user input may be vernacular Chinese or classical Chinese.",
    "Return one JSON object only.",
    "Rules:",
    '- "detectedMode" must be either "vernacular" or "classical".',
    '- "normalizedQuery" must be one concise modern Chinese question.',
    '- "intent" should be a short English label such as advice, judgement, reflection, planning.',
    '- "tone" should be a short English label such as measured, soothing, instructive, urgent.',
    '- "topics" should contain 2 to 8 short Chinese topic phrases when possible.',
    "Do not add markdown fences or extra commentary.",
    "",
    "Expected JSON shape:",
    '{"detectedMode":"vernacular","normalizedQuery":"...","intent":"advice","tone":"measured","topics":["..."]}',
    "",
    `Input mode hint: ${mode}`,
    `User input: ${input}`
  ].join("\n");
}

export function buildGenerationPrompt(context: GenerationContext): string {
  const personaLine = context.persona
    ? `${context.persona.name} | ${context.personaSummary ?? context.persona.styleSummary}`
    : "none";

  return [
    "You generate classical Chinese answers for a Chinese writing assistant.",
    `Return exactly ${context.variantsCount} items as a JSON array only.`,
    "Rules for each item:",
    '- "title" must be a short modern Chinese label.',
    '- "tone" must be one of: balanced, deliberative, persona.',
    '- "classicalText" must be written in Chinese classical style and must directly answer the question.',
    '- "classicalText" must stay in Chinese only. Do not use English.',
    '- "styleNotes" must be 1 to 3 short modern Chinese notes.',
    "- Keep each answer readable, compact, and useful.",
    "- If a persona is provided, reflect that persona's reasoning style without pretending to quote a fake original text.",
    "Do not add markdown fences or extra commentary.",
    "",
    "Expected JSON shape:",
    '[{"title":"稳志版","tone":"balanced","classicalText":"...","styleNotes":["..."]}]',
    "",
    `Normalized modern Chinese question: ${context.normalized.normalizedQuery}`,
    `Topics: ${context.normalized.topics.join(", ") || "none"}`,
    `Intent: ${context.normalized.intent}`,
    `Tone hint: ${context.normalized.tone}`,
    `AI intervention mode: ${context.aiIntervention}`,
    `AI intervention guide: ${formatAiInterventionGuide(context)}`,
    "User context:",
    formatUserContextBlock(context),
    `Persona: ${personaLine}`,
    "Supporting source snippets:",
    formatSourceBlock(context)
  ].join("\n");
}

export function buildExplanationPrompt(variant: GeneratedVariantDraft, normalizedQuery: string): string {
  return [
    "You explain classical Chinese answers in modern Chinese.",
    "Return one JSON object only.",
    "Rules:",
    '- "literalExplanation" must be a close modern Chinese explanation.',
    '- "freeExplanation" must be a smoother paraphrase in modern Chinese.',
    '- "glossExplanation" must summarize key wording and rhetoric in modern Chinese.',
    '- "lineByLinePairs" must align classical segments with modern Chinese segments.',
    '- Each lineByLinePairs item may include short modern Chinese notes.',
    "Do not add markdown fences or extra commentary.",
    "",
    "Expected JSON shape:",
    '{"literalExplanation":"...","freeExplanation":"...","glossExplanation":"...","lineByLinePairs":[{"classicalSegment":"...","vernacularSegment":"...","notes":["..."]}]}',
    "",
    `Original modern Chinese question: ${normalizedQuery}`,
    `Classical Chinese answer: ${variant.classicalText}`
  ].join("\n");
}
