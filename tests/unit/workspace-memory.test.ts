import { describe, expect, it } from "vitest";

import type { ExplanationMode, GenerateResponse, VariantResult } from "@/lib/types/generation";
import {
  createLocalWorkspaceProfile,
  createFeedbackEntry,
  createFavoriteAnswer,
  createHistoryEntry,
  createProfileBackup,
  createFeedbackKey,
  filterFavoriteAnswers,
  formatGenerationMarkdown,
  isQuestionHistoryEntry,
  parseProfileBackup,
  parseJsonArray,
  toggleFavoriteAnswer,
  upsertFeedbackEntry,
  upsertHistoryEntry,
  type FeedbackEntry,
  type QuestionHistoryEntry
} from "@/lib/utils/workspace-memory";

const variant: VariantResult = {
  id: "variant-1",
  title: "持重版",
  classicalText: "夫志定而后行。",
  literalExplanation: "先稳定志向再行动。",
  freeExplanation: "先明确目标，再开始执行。",
  glossExplanation: "夫用于发端。",
  lineByLinePairs: [],
  sources: [{
    id: "knowledge-1",
    sourceType: "knowledge",
    title: "自律与惜时表达",
    author: "示例语料",
    excerpt: "适用于拖延、自律、效率与规划。",
    score: 1
  }]
};

const result: GenerateResponse = {
  normalizedQuery: "如何减少拖延并坚持计划",
  detectedInputMode: "vernacular",
  persona: {
    id: "zhuge-liang",
    name: "诸葛亮",
    dynasty: "三国",
    description: "重筹划。",
    styleSummary: "条理分明。",
    sourceCount: 3
  },
  variants: [variant],
  retrievalRefs: [],
  debug: {
    normalizationNotes: ["意图：求策", "语气：劝勉", "主题：拖延、自律"],
    provider: "演示模式",
    aiIntervention: "balanced",
    retrievalMode: "auto"
  }
};

const settings = {
  query: "最近总拖延怎么办？",
  inputMode: "auto" as const,
  variantsCount: 3,
  explanationModes: ["literal", "free", "gloss"] as ExplanationMode[],
  aiIntervention: "balanced" as const,
  retrievalMode: "auto" as const,
  personaId: "zhuge-liang",
  providerId: "mock",
  userContext: {
    useCase: "学习计划"
  }
};

describe("workspace memory utilities", () => {
  it("keeps recent history entries bounded and newest first", () => {
    const entries = Array.from({ length: 25 }, (_, index) => createHistoryEntry({
      id: `history-${index}`,
      createdAt: new Date(index).toISOString(),
      settings: {
        ...settings,
        query: `问题 ${index}`
      },
      result
    }));

    const next = entries.reduce<QuestionHistoryEntry[]>((current, entry) => upsertHistoryEntry(current, entry), []);

    expect(next).toHaveLength(20);
    expect(next[0].query).toBe("问题 24");
  });

  it("parses only valid history entries from storage", () => {
    const entry = createHistoryEntry({
      id: "history-valid",
      createdAt: new Date(0).toISOString(),
      settings,
      result
    });

    const parsed = parseJsonArray(JSON.stringify([entry, { id: 1 }]), isQuestionHistoryEntry);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("history-valid");
  });

  it("toggles and filters favorites by persona and topic", () => {
    const favorite = createFavoriteAnswer({
      id: "favorite-1",
      createdAt: new Date(0).toISOString(),
      query: settings.query,
      result,
      variant
    });

    const added = toggleFavoriteAnswer([], favorite);
    const removed = toggleFavoriteAnswer(added, favorite);

    expect(added).toHaveLength(1);
    expect(removed).toHaveLength(0);
    expect(filterFavoriteAnswers(added, "zhuge-liang", "自律")).toHaveLength(1);
    expect(filterFavoriteAnswers(added, "kongzi", "自律")).toHaveLength(0);
  });

  it("exports generation markdown with answer and sources", () => {
    const markdown = formatGenerationMarkdown({
      query: settings.query,
      result
    });

    expect(markdown).toContain("夫志定而后行。");
    expect(markdown).toContain("自律与惜时表达");
  });

  it("round-trips local profile backups", () => {
    const profile = createLocalWorkspaceProfile({
      id: "profile-1",
      name: "本机用户",
      createdAt: new Date(0).toISOString()
    });
    const historyEntry = createHistoryEntry({
      id: "history-valid",
      createdAt: new Date(0).toISOString(),
      settings,
      result
    });
    const favorite = createFavoriteAnswer({
      id: "favorite-1",
      createdAt: new Date(0).toISOString(),
      query: settings.query,
      result,
      variant
    });
    const feedback = createFeedbackEntry({
      id: "feedback-1",
      createdAt: new Date(0).toISOString(),
      query: settings.query,
      result,
      variant,
      rating: "useful"
    });
    const backup = createProfileBackup({
      exportedAt: new Date(1).toISOString(),
      profile,
      userContext: settings.userContext,
      historyEntries: [historyEntry],
      favorites: [favorite],
      feedbackEntries: [feedback]
    });

    const parsed = parseProfileBackup(JSON.stringify(backup));

    expect(parsed?.profile.name).toBe("本机用户");
    expect(parsed?.historyEntries).toHaveLength(1);
    expect(parsed?.favorites).toHaveLength(1);
    expect(parsed?.feedbackEntries).toHaveLength(1);
    expect(parseProfileBackup("{bad json")).toBeNull();
  });

  it("upserts one feedback entry per answer variant", () => {
    const first = createFeedbackEntry({
      id: "feedback-1",
      createdAt: new Date(0).toISOString(),
      query: settings.query,
      result,
      variant,
      rating: "useful"
    });
    const second: FeedbackEntry = {
      ...first,
      id: "feedback-2",
      rating: "too-long",
      createdAt: new Date(1).toISOString()
    };
    const entries = [first, second].reduce<FeedbackEntry[]>((current, entry) => upsertFeedbackEntry(current, entry), []);

    expect(entries).toHaveLength(1);
    expect(entries[0].rating).toBe("too-long");
    expect(entries[0].feedbackKey).toBe(createFeedbackKey({
      normalizedQuery: result.normalizedQuery,
      variantId: variant.id,
      classicalText: variant.classicalText
    }));
  });
});
