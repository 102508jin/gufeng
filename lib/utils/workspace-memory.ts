import type {
  AiInterventionMode,
  ExplanationMode,
  GenerateResponse,
  InputMode,
  RetrievalMode,
  UserContext,
  VariantResult
} from "@/lib/types/generation";
import type { SourceRef } from "@/lib/types/retrieval";

export const MAX_HISTORY_ENTRIES = 20;
export const MAX_FEEDBACK_ENTRIES = 100;
export const LOCAL_PROFILE_BACKUP_VERSION = 1;
export type FeedbackRating = "useful" | "inaccurate" | "too-long" | "too-classical";

export type LocalWorkspaceProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalProfileBackup = {
  version: typeof LOCAL_PROFILE_BACKUP_VERSION;
  exportedAt: string;
  profile: LocalWorkspaceProfile;
  userContext: UserContext;
  historyEntries: QuestionHistoryEntry[];
  favorites: FavoriteAnswer[];
  feedbackEntries?: FeedbackEntry[];
};

export type GenerationSettingsSnapshot = {
  query: string;
  inputMode: InputMode;
  variantsCount: number;
  explanationModes: ExplanationMode[];
  aiIntervention: AiInterventionMode;
  retrievalMode: RetrievalMode;
  personaId: string;
  providerId: string;
  userContext: UserContext;
};

export type QuestionHistoryEntry = GenerationSettingsSnapshot & {
  id: string;
  createdAt: string;
  normalizedQuery: string;
  personaName?: string;
  providerLabel?: string;
  topics: string[];
};

export type FavoriteAnswer = {
  id: string;
  favoriteKey: string;
  createdAt: string;
  query: string;
  normalizedQuery: string;
  personaId: string;
  personaName?: string;
  topics: string[];
  variantTitle: string;
  classicalText: string;
  literalExplanation?: string;
  freeExplanation?: string;
  glossExplanation?: string;
  sources: SourceRef[];
};

export type FeedbackEntry = {
  id: string;
  feedbackKey: string;
  createdAt: string;
  rating: FeedbackRating;
  query: string;
  normalizedQuery: string;
  variantId: string;
  variantTitle: string;
  personaId: string;
  personaName?: string;
  providerId?: string;
  providerLabel?: string;
  classicalText: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function normalizeProfileName(value: string, fallback = "本机用户"): string {
  const normalized = value.trim().replace(/\s+/gu, " ");
  return normalized.slice(0, 40) || fallback;
}

export function createLocalWorkspaceProfile(params: {
  id: string;
  name: string;
  createdAt: string;
}): LocalWorkspaceProfile {
  return {
    id: params.id,
    name: normalizeProfileName(params.name),
    createdAt: params.createdAt,
    updatedAt: params.createdAt
  };
}

export function parseJsonArray<T>(value: string | null, guard: (item: unknown) => item is T): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(guard);
  } catch {
    return [];
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isExplanationModeArray(value: unknown): value is ExplanationMode[] {
  return Array.isArray(value) && value.every((item) => item === "literal" || item === "free" || item === "gloss");
}

function isFeedbackRating(value: unknown): value is FeedbackRating {
  return value === "useful" || value === "inaccurate" || value === "too-long" || value === "too-classical";
}

export function isUserContext(value: unknown): value is UserContext {
  if (!value || typeof value !== "object") {
    return true;
  }

  const record = value as Record<string, unknown>;
  return ["displayName", "useCase", "preference"].every(
    (key) => record[key] === undefined || typeof record[key] === "string"
  );
}

export function isLocalWorkspaceProfile(value: unknown): value is LocalWorkspaceProfile {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string"
    && typeof value.name === "string"
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string";
}

export function isQuestionHistoryEntry(value: unknown): value is QuestionHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.id === "string"
    && typeof record.createdAt === "string"
    && typeof record.query === "string"
    && typeof record.normalizedQuery === "string"
    && (record.inputMode === "auto" || record.inputMode === "vernacular" || record.inputMode === "classical")
    && typeof record.variantsCount === "number"
    && isExplanationModeArray(record.explanationModes)
    && (record.aiIntervention === "conservative" || record.aiIntervention === "balanced" || record.aiIntervention === "creative")
    && (record.retrievalMode === "off" || record.retrievalMode === "focused" || record.retrievalMode === "auto" || record.retrievalMode === "broad")
    && typeof record.personaId === "string"
    && typeof record.providerId === "string"
    && isUserContext(record.userContext)
    && isStringArray(record.topics);
}

export function isFavoriteAnswer(value: unknown): value is FavoriteAnswer {
  if (!isRecord(value)) {
    return false;
  }

  const record = value;
  return typeof record.id === "string"
    && typeof record.favoriteKey === "string"
    && typeof record.createdAt === "string"
    && typeof record.query === "string"
    && typeof record.normalizedQuery === "string"
    && typeof record.personaId === "string"
    && isStringArray(record.topics)
    && typeof record.variantTitle === "string"
    && typeof record.classicalText === "string"
    && Array.isArray(record.sources);
}

export function isFeedbackEntry(value: unknown): value is FeedbackEntry {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string"
    && typeof value.feedbackKey === "string"
    && typeof value.createdAt === "string"
    && isFeedbackRating(value.rating)
    && typeof value.query === "string"
    && typeof value.normalizedQuery === "string"
    && typeof value.variantId === "string"
    && typeof value.variantTitle === "string"
    && typeof value.personaId === "string"
    && typeof value.classicalText === "string";
}

export function createProfileBackup(params: {
  exportedAt: string;
  profile: LocalWorkspaceProfile;
  userContext: UserContext;
  historyEntries: QuestionHistoryEntry[];
  favorites: FavoriteAnswer[];
  feedbackEntries?: FeedbackEntry[];
}): LocalProfileBackup {
  return {
    version: LOCAL_PROFILE_BACKUP_VERSION,
    exportedAt: params.exportedAt,
    profile: params.profile,
    userContext: params.userContext,
    historyEntries: params.historyEntries,
    favorites: params.favorites,
    feedbackEntries: params.feedbackEntries ?? []
  };
}

export function isLocalProfileBackup(value: unknown): value is LocalProfileBackup {
  if (!isRecord(value)) {
    return false;
  }

  return value.version === LOCAL_PROFILE_BACKUP_VERSION
    && typeof value.exportedAt === "string"
    && isLocalWorkspaceProfile(value.profile)
    && isUserContext(value.userContext)
    && Array.isArray(value.historyEntries)
    && value.historyEntries.every(isQuestionHistoryEntry)
    && Array.isArray(value.favorites)
    && value.favorites.every(isFavoriteAnswer)
    && (value.feedbackEntries === undefined || (Array.isArray(value.feedbackEntries) && value.feedbackEntries.every(isFeedbackEntry)));
}

export function parseProfileBackup(value: string): LocalProfileBackup | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isLocalProfileBackup(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function extractTopics(result: GenerateResponse): string[] {
  const topicNote = result.debug?.normalizationNotes?.find((note) => note.startsWith("主题："));
  const rawTopics = topicNote?.replace(/^主题：/u, "").split("、") ?? [];
  return rawTopics.map((topic) => topic.trim()).filter((topic) => topic && topic !== "未识别");
}

export function createHistoryEntry(params: {
  id: string;
  createdAt: string;
  settings: GenerationSettingsSnapshot;
  result: GenerateResponse;
  providerLabel?: string;
}): QuestionHistoryEntry {
  return {
    ...params.settings,
    id: params.id,
    createdAt: params.createdAt,
    normalizedQuery: params.result.normalizedQuery,
    personaName: params.result.persona?.name,
    providerLabel: params.providerLabel ?? params.result.debug?.provider,
    topics: extractTopics(params.result)
  };
}

export function upsertHistoryEntry(
  entries: QuestionHistoryEntry[],
  entry: QuestionHistoryEntry,
  limit = MAX_HISTORY_ENTRIES
): QuestionHistoryEntry[] {
  const normalizedQuery = entry.query.trim();
  const withoutDuplicate = entries.filter((item) => {
    return item.query.trim() !== normalizedQuery
      || item.personaId !== entry.personaId
      || item.aiIntervention !== entry.aiIntervention
      || item.retrievalMode !== entry.retrievalMode;
  });

  return [entry, ...withoutDuplicate].slice(0, limit);
}

export function createFavoriteKey(params: {
  normalizedQuery: string;
  personaId?: string | null;
  classicalText: string;
}): string {
  return [
    params.normalizedQuery.trim(),
    params.personaId ?? "",
    params.classicalText.replace(/\s+/gu, "")
  ].join("|");
}

export function createFavoriteAnswer(params: {
  id: string;
  createdAt: string;
  query: string;
  result: GenerateResponse;
  variant: VariantResult;
}): FavoriteAnswer {
  return {
    id: params.id,
    favoriteKey: createFavoriteKey({
      normalizedQuery: params.result.normalizedQuery,
      personaId: params.result.persona?.id,
      classicalText: params.variant.classicalText
    }),
    createdAt: params.createdAt,
    query: params.query,
    normalizedQuery: params.result.normalizedQuery,
    personaId: params.result.persona?.id ?? "",
    personaName: params.result.persona?.name,
    topics: extractTopics(params.result),
    variantTitle: params.variant.title,
    classicalText: params.variant.classicalText,
    literalExplanation: params.variant.literalExplanation,
    freeExplanation: params.variant.freeExplanation,
    glossExplanation: params.variant.glossExplanation,
    sources: params.variant.sources
  };
}

export function createFeedbackKey(params: {
  normalizedQuery: string;
  variantId: string;
  classicalText: string;
}): string {
  return [
    params.normalizedQuery.trim(),
    params.variantId,
    params.classicalText.replace(/\s+/gu, "")
  ].join("|");
}

export function createFeedbackEntry(params: {
  id: string;
  createdAt: string;
  query: string;
  result: GenerateResponse;
  variant: VariantResult;
  rating: FeedbackRating;
}): FeedbackEntry {
  return {
    id: params.id,
    feedbackKey: createFeedbackKey({
      normalizedQuery: params.result.normalizedQuery,
      variantId: params.variant.id,
      classicalText: params.variant.classicalText
    }),
    createdAt: params.createdAt,
    rating: params.rating,
    query: params.query,
    normalizedQuery: params.result.normalizedQuery,
    variantId: params.variant.id,
    variantTitle: params.variant.title,
    personaId: params.result.persona?.id ?? "",
    personaName: params.result.persona?.name,
    providerId: params.result.debug?.providerId,
    providerLabel: params.result.debug?.provider,
    classicalText: params.variant.classicalText
  };
}

export function upsertFeedbackEntry(
  entries: FeedbackEntry[],
  entry: FeedbackEntry,
  limit = MAX_FEEDBACK_ENTRIES
): FeedbackEntry[] {
  return [entry, ...entries.filter((item) => item.feedbackKey !== entry.feedbackKey)].slice(0, limit);
}

export function toggleFavoriteAnswer(favorites: FavoriteAnswer[], favorite: FavoriteAnswer): FavoriteAnswer[] {
  const exists = favorites.some((item) => item.favoriteKey === favorite.favoriteKey);
  if (exists) {
    return favorites.filter((item) => item.favoriteKey !== favorite.favoriteKey);
  }

  return [favorite, ...favorites];
}

export function filterFavoriteAnswers(
  favorites: FavoriteAnswer[],
  personaId: string,
  topicKeyword: string
): FavoriteAnswer[] {
  const keyword = topicKeyword.trim();
  return favorites.filter((favorite) => {
    const personaMatches = !personaId || favorite.personaId === personaId;
    const topicMatches = !keyword
      || favorite.topics.some((topic) => topic.includes(keyword))
      || favorite.normalizedQuery.includes(keyword)
      || favorite.query.includes(keyword);

    return personaMatches && topicMatches;
  });
}

export function formatSourcesMarkdown(sources: SourceRef[]): string {
  if (!sources.length) {
    return "- 无";
  }

  return sources.map((source) => {
    const metadata = [
      source.author,
      source.source,
      source.chunkId ? `chunk ${source.chunkId}` : null,
      source.license ? `license ${source.license}` : null
    ].filter(Boolean);
    const suffix = metadata.length ? ` (${metadata.join(", ")})` : "";
    return `- ${source.title}${suffix}: ${source.excerpt}`;
  }).join("\n");
}

export function formatVariantMarkdown(variant: VariantResult): string {
  return [
    `### ${variant.title}`,
    "",
    variant.classicalText,
    "",
    "#### 逐句直解",
    variant.literalExplanation ?? "无",
    "",
    "#### 意译阐释",
    variant.freeExplanation ?? "无",
    "",
    "#### 词义注释",
    variant.glossExplanation ?? "无",
    "",
    "#### 参考来源",
    formatSourcesMarkdown(variant.sources)
  ].join("\n");
}

export function formatGenerationMarkdown(params: {
  query: string;
  result: GenerateResponse;
}): string {
  return [
    `# ${params.result.normalizedQuery}`,
    "",
    `原始问题: ${params.query}`,
    `识别输入: ${params.result.detectedInputMode === "classical" ? "文言文" : "白话文"}`,
    `角色: ${params.result.persona?.name ?? "通用文言语气"}`,
    `模型: ${params.result.debug?.provider ?? "未知"}`,
    `AI 介入: ${params.result.debug?.aiIntervention ?? "balanced"}`,
    `知识库: ${params.result.debug?.retrievalMode ?? "auto"}`,
    "",
    ...params.result.variants.flatMap((variant) => [formatVariantMarkdown(variant), ""])
  ].join("\n");
}

export function formatGenerationJson(params: {
  query: string;
  result: GenerateResponse;
}): string {
  return JSON.stringify(
    {
      query: params.query,
      exportedAt: new Date().toISOString(),
      result: params.result
    },
    null,
    2
  );
}

export function formatFavoriteMarkdown(favorite: FavoriteAnswer): string {
  return [
    `# ${favorite.variantTitle}`,
    "",
    `原始问题: ${favorite.query}`,
    `归一化问题: ${favorite.normalizedQuery}`,
    `角色: ${favorite.personaName ?? "通用文言语气"}`,
    favorite.topics.length ? `主题: ${favorite.topics.join("、")}` : "",
    "",
    favorite.classicalText,
    "",
    "## 解释",
    favorite.freeExplanation ?? favorite.literalExplanation ?? "无",
    "",
    "## 来源",
    formatSourcesMarkdown(favorite.sources)
  ].filter(Boolean).join("\n");
}
