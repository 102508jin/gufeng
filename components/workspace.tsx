"use client";

import { useEffect, useState } from "react";

import { ChatInput } from "@/components/chat-input";
import { KnowledgeImportPanel } from "@/components/knowledge-import-panel";
import { VariantCard } from "@/components/variant-card";
import { WorkspaceMemoryPanel } from "@/components/workspace-memory-panel";
import {
  DEFAULT_AI_INTERVENTION,
  DEFAULT_EXPLANATION_MODES,
  DEFAULT_RETRIEVAL_MODE,
  DEFAULT_VARIANTS_COUNT
} from "@/lib/config/constants";
import type { ApiResult } from "@/lib/types/api";
import type {
  AiInterventionMode,
  ExplanationMode,
  GenerateResponse,
  InputMode,
  RetrievalMode,
  UserContext,
  VariantResult
} from "@/lib/types/generation";
import type { PersonaProfile } from "@/lib/types/persona";
import type { PublicModelProfile } from "@/lib/types/provider";
import type { SourceRef } from "@/lib/types/retrieval";
import type { KnowledgeImportInput, KnowledgeImportResult } from "@/lib/types/knowledge-import";
import {
  createLocalWorkspaceProfile,
  createFeedbackEntry,
  createFeedbackKey,
  createFavoriteAnswer,
  createFavoriteKey,
  createHistoryEntry,
  createProfileBackup,
  filterFavoriteAnswers,
  formatFavoriteMarkdown,
  formatGenerationJson,
  formatGenerationMarkdown,
  formatSourcesMarkdown,
  formatVariantMarkdown,
  isFavoriteAnswer,
  isFeedbackEntry,
  isLocalWorkspaceProfile,
  isQuestionHistoryEntry,
  normalizeProfileName,
  parseJsonArray,
  parseProfileBackup,
  toggleFavoriteAnswer,
  upsertFeedbackEntry,
  type FeedbackEntry,
  type FeedbackRating,
  upsertHistoryEntry,
  type FavoriteAnswer,
  type LocalWorkspaceProfile,
  type QuestionHistoryEntry
} from "@/lib/utils/workspace-memory";

const starterQuestion =
  "\u6700\u8fd1\u603b\u89c9\u5f97\u8ba1\u5212\u5f88\u591a\u5374\u603b\u62d6\u5ef6\uff0c\u5e94\u8be5\u600e\u6837\u7a33\u4f4f\u5fc3\u5fd7\u5e76\u771f\u6b63\u884c\u52a8\u8d77\u6765\uff1f";
const userContextStorageKey = "wenyan-agent:user-context:v1";
const historyStorageKey = "wenyan-agent:question-history:v1";
const favoritesStorageKey = "wenyan-agent:favorites:v1";
const profilesStorageKey = "wenyan-agent:profiles:v1";
const activeProfileStorageKey = "wenyan-agent:active-profile:v1";

const text = {
  providerOllama: "\u672c\u5730 Ollama",
  providerOpenai: "OpenAI \u63a5\u53e3",
  providerAnthropic: "Claude / Anthropic",
  providerMock: "\u6f14\u793a\u6a21\u5f0f",
  providerUnknown: "\u672a\u77e5",
  loadPersonasFailed: "\u89d2\u8272\u5217\u8868\u52a0\u8f7d\u5931\u8d25\u3002",
  loadProvidersFailed: "\u6a21\u578b\u9a71\u52a8\u5217\u8868\u52a0\u8f7d\u5931\u8d25\u3002",
  generationFailed: "\u751f\u6210\u5931\u8d25\u3002",
  knowledgeSearchFailed: "\u77e5\u8bc6\u5e93\u68c0\u7d22\u5931\u8d25\u3002",
  knowledgeImportFailed: "\u77e5\u8bc6\u5e93\u5bfc\u5165\u5931\u8d25\u3002",
  knowledgeImported: "\u5df2\u5bfc\u5165\u77e5\u8bc6\u5e93\uff1a",
  copied: "\u5df2\u590d\u5236\u3002",
  copyFailed: "\u590d\u5236\u5931\u8d25\u3002",
  exported: "\u5df2\u5bfc\u51fa\u3002",
  favorited: "\u5df2\u6536\u85cf\u3002",
  favoriteRemoved: "\u5df2\u53d6\u6d88\u6536\u85cf\u3002",
  feedbackSaved: "\u5df2\u8bb0\u5f55\u4f60\u7684\u53cd\u9988\u3002",
  historyApplied: "\u5df2\u590d\u7528\u5386\u53f2\u914d\u7f6e\u3002",
  historyCleared: "\u5df2\u6e05\u7a7a\u5386\u53f2\u3002",
  profileSwitched: "\u5df2\u5207\u6362\u672c\u5730\u914d\u7f6e\u6863\u3002",
  profileCreated: "\u5df2\u65b0\u5efa\u672c\u5730\u914d\u7f6e\u6863\u3002",
  profileRenamed: "\u5df2\u91cd\u547d\u540d\u672c\u5730\u914d\u7f6e\u6863\u3002",
  profileDeleted: "\u5df2\u5220\u9664\u672c\u5730\u914d\u7f6e\u6863\u3002",
  profileDeleteBlocked: "\u81f3\u5c11\u9700\u8981\u4fdd\u7559\u4e00\u4e2a\u672c\u5730\u914d\u7f6e\u6863\u3002",
  profileBackupExported: "\u5df2\u5bfc\u51fa\u672c\u5730\u914d\u7f6e\u6863\u5907\u4efd\u3002",
  profileBackupImported: "\u5df2\u5bfc\u5165\u672c\u5730\u914d\u7f6e\u6863\u5907\u4efd\u3002",
  profileBackupInvalid: "\u5907\u4efd\u6587\u4ef6\u683c\u5f0f\u4e0d\u5408\u6cd5\u3002",
  queryTooShort: "\u63d0\u95ee\u8fc7\u77ed\uff0c\u5efa\u8bae\u8865\u5145\u80cc\u666f\u3002",
  queryTooLong: "\u63d0\u95ee\u8f83\u957f\uff0c\u5efa\u8bae\u538b\u7f29\u5230 800 \u5b57\u4ee5\u5185\u3002",
  preferenceEmpty: "\u53ef\u586b\u5199\u7528\u9014\u6216\u504f\u597d\uff0c\u4fbf\u4e8e\u8f93\u51fa\u66f4\u8d34\u5408\u573a\u666f\u3002",
  providerNotConfigured: "\u5f53\u524d\u6a21\u578b\u9a71\u52a8\u4e0d\u53ef\u7528\uff0c\u5c06\u8ddf\u968f\u9ed8\u8ba4\u53ef\u7528\u914d\u7f6e\u3002",
  heroEyebrow: "\u53e4\u98ce\u95ee\u7b54",
  heroTitle: "\u6587\u8a00\u6587\u56de\u7b54\u667a\u80fd\u4f53",
  heroCopy: "\u767d\u8bdd\u6216\u6587\u8a00\u63d0\u95ee\uff0c\u53ef\u9009\u89d2\u8272\u98ce\u683c\u3001AI \u4ecb\u5165\u5f3a\u5ea6\u4e0e\u672c\u5730 RAG \u77e5\u8bc6\u5e93\u3002",
  normalizedQuery: "\u5f52\u4e00\u5316\u95ee\u9898",
  detectedMode: "\u8bc6\u522b\u8f93\u5165",
  provider: "\u6a21\u578b\u63d0\u4f9b\u65b9",
  persona: "\u5f53\u524d\u89d2\u8272",
  aiIntervention: "AI \u4ecb\u5165",
  retrievalMode: "\u77e5\u8bc6\u5e93",
  classical: "\u6587\u8a00\u6587",
  vernacular: "\u767d\u8bdd\u6587",
  genericPersona: "\u901a\u7528\u6587\u8a00\u8bed\u6c14",
  conservative: "\u7a33\u59a5",
  balanced: "\u5e73\u8861",
  creative: "\u521b\u4f5c",
  retrievalOff: "\u5173\u95ed",
  retrievalFocused: "\u7cbe\u51c6",
  retrievalAuto: "\u6807\u51c6",
  retrievalBroad: "\u5e7f\u641c",
  resultTitle: "\u751f\u6210\u7ed3\u679c",
  exportMarkdown: "\u5bfc\u51fa Markdown",
  exportJson: "\u5bfc\u51fa JSON",
  previewEyebrow: "\u7ed3\u679c\u9884\u89c8",
  previewTitle: "\u8f93\u5165\u95ee\u9898\u540e\u5373\u53ef\u751f\u6210\u6587\u8a00\u7b54\u590d\u3002",
  previewCopy: "\u8f93\u5165\u95ee\u9898\u540e\u5373\u53ef\u751f\u6210\u6587\u8a00\u7b54\u590d\uff0c\u5e76\u67e5\u770b\u9010\u53e5\u89e3\u6790\u4e0e\u53c2\u8003\u6765\u6e90\u3002",
  notesSeparator: "\u3001"
} as const;

const providerLabels: Record<string, string> = {
  ollama: text.providerOllama,
  openai: text.providerOpenai,
  "openai-compatible": text.providerOpenai,
  anthropic: text.providerAnthropic,
  mock: text.providerMock,
  [text.providerOllama]: text.providerOllama,
  [text.providerOpenai]: text.providerOpenai,
  [text.providerAnthropic]: text.providerAnthropic,
  [text.providerMock]: text.providerMock
};

function formatProvider(provider?: string) {
  if (!provider) {
    return text.providerUnknown;
  }

  return providerLabels[provider] ?? provider;
}

function formatAiIntervention(mode?: AiInterventionMode) {
  switch (mode) {
    case "conservative":
      return text.conservative;
    case "creative":
      return text.creative;
    default:
      return text.balanced;
  }
}

function formatRetrievalMode(mode?: RetrievalMode) {
  switch (mode) {
    case "off":
      return text.retrievalOff;
    case "focused":
      return text.retrievalFocused;
    case "broad":
      return text.retrievalBroad;
    default:
      return text.retrievalAuto;
  }
}

function parseStoredUserContext(value: string | null): UserContext {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Partial<UserContext>;
    return {
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
      useCase: typeof parsed.useCase === "string" ? parsed.useCase : "",
      preference: typeof parsed.preference === "string" ? parsed.preference : ""
    };
  } catch {
    return {};
  }
}

function readStoredUserContext(): UserContext {
  try {
    return parseStoredUserContext(window.localStorage.getItem(userContextStorageKey));
  } catch {
    return {};
  }
}

function writeStoredUserContext(userContext: UserContext) {
  try {
    window.localStorage.setItem(userContextStorageKey, JSON.stringify(userContext));
  } catch {
    // User preferences are progressive enhancement; generation should still work without storage.
  }
}

function readStoredHistory(): QuestionHistoryEntry[] {
  try {
    return parseJsonArray(window.localStorage.getItem(historyStorageKey), isQuestionHistoryEntry);
  } catch {
    return [];
  }
}

function readStoredFavorites(): FavoriteAnswer[] {
  try {
    return parseJsonArray(window.localStorage.getItem(favoritesStorageKey), isFavoriteAnswer);
  } catch {
    return [];
  }
}

function writeStorageValue(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local memory is optional and should not block the core generation flow.
  }
}

function profileUserContextStorageKey(profileId: string) {
  return `wenyan-agent:profile:${profileId}:user-context:v1`;
}

function profileHistoryStorageKey(profileId: string) {
  return `wenyan-agent:profile:${profileId}:question-history:v1`;
}

function profileFavoritesStorageKey(profileId: string) {
  return `wenyan-agent:profile:${profileId}:favorites:v1`;
}

function profileFeedbackStorageKey(profileId: string) {
  return `wenyan-agent:profile:${profileId}:feedback:v1`;
}

function readStoredProfiles(): LocalWorkspaceProfile[] {
  try {
    return parseJsonArray(window.localStorage.getItem(profilesStorageKey), isLocalWorkspaceProfile);
  } catch {
    return [];
  }
}

function readStoredActiveProfileId() {
  try {
    return window.localStorage.getItem(activeProfileStorageKey) ?? "";
  } catch {
    return "";
  }
}

function readProfileUserContext(profileId: string, fallback: UserContext): UserContext {
  try {
    const stored = window.localStorage.getItem(profileUserContextStorageKey(profileId));
    return stored ? parseStoredUserContext(stored) : fallback;
  } catch {
    return fallback;
  }
}

function readProfileHistory(profileId: string, fallback: QuestionHistoryEntry[]): QuestionHistoryEntry[] {
  try {
    const stored = window.localStorage.getItem(profileHistoryStorageKey(profileId));
    return stored ? parseJsonArray(stored, isQuestionHistoryEntry) : fallback;
  } catch {
    return fallback;
  }
}

function readProfileFavorites(profileId: string, fallback: FavoriteAnswer[]): FavoriteAnswer[] {
  try {
    const stored = window.localStorage.getItem(profileFavoritesStorageKey(profileId));
    return stored ? parseJsonArray(stored, isFavoriteAnswer) : fallback;
  } catch {
    return fallback;
  }
}

function readProfileFeedback(profileId: string, fallback: FeedbackEntry[]): FeedbackEntry[] {
  try {
    const stored = window.localStorage.getItem(profileFeedbackStorageKey(profileId));
    return stored ? parseJsonArray(stored, isFeedbackEntry) : fallback;
  } catch {
    return fallback;
  }
}

function removeProfileStorage(profileId: string) {
  try {
    window.localStorage.removeItem(profileUserContextStorageKey(profileId));
    window.localStorage.removeItem(profileHistoryStorageKey(profileId));
    window.localStorage.removeItem(profileFavoritesStorageKey(profileId));
    window.localStorage.removeItem(profileFeedbackStorageKey(profileId));
  } catch {
    // Local cleanup is best effort.
  }
}

function createLocalId(prefix: string) {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readInitialLocalWorkspace() {
  const storedProfiles = readStoredProfiles();
  const legacyUserContext = readStoredUserContext();
  const legacyHistory = readStoredHistory();
  const legacyFavorites = readStoredFavorites();

  if (storedProfiles.length) {
    const storedActiveProfileId = readStoredActiveProfileId();
    const activeProfile = storedProfiles.find((profile) => profile.id === storedActiveProfileId) ?? storedProfiles[0];
    return {
      profiles: storedProfiles,
      activeProfile,
      userContext: readProfileUserContext(activeProfile.id, activeProfile.id === storedActiveProfileId ? {} : legacyUserContext),
      historyEntries: readProfileHistory(activeProfile.id, []),
      favorites: readProfileFavorites(activeProfile.id, []),
      feedbackEntries: readProfileFeedback(activeProfile.id, [])
    };
  }

  const createdAt = new Date().toISOString();
  const profile = createLocalWorkspaceProfile({
    id: createLocalId("profile"),
    name: legacyUserContext.displayName || "本机用户",
    createdAt
  });

  return {
    profiles: [profile],
    activeProfile: profile,
    userContext: legacyUserContext,
    historyEntries: legacyHistory,
    favorites: legacyFavorites,
    feedbackEntries: []
  };
}

export function Workspace() {
  const [query, setQuery] = useState(starterQuestion);
  const [inputMode, setInputMode] = useState<InputMode>("auto");
  const [variantsCount, setVariantsCount] = useState(DEFAULT_VARIANTS_COUNT);
  const [explanationModes, setExplanationModes] = useState<ExplanationMode[]>(DEFAULT_EXPLANATION_MODES);
  const [aiIntervention, setAiIntervention] = useState<AiInterventionMode>(DEFAULT_AI_INTERVENTION);
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(DEFAULT_RETRIEVAL_MODE);
  const [profiles, setProfiles] = useState<LocalWorkspaceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [userContext, setUserContext] = useState<UserContext>({});
  const [hasLoadedMemory, setHasLoadedMemory] = useState(false);
  const [personaId, setPersonaId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [providers, setProviders] = useState<PublicModelProfile[]>([]);
  const [historyEntries, setHistoryEntries] = useState<QuestionHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAnswer[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [favoritePersonaFilter, setFavoritePersonaFilter] = useState("");
  const [favoriteTopicFilter, setFavoriteTopicFilter] = useState("");
  const [knowledgeRefs, setKnowledgeRefs] = useState<SourceRef[]>([]);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [knowledgeImportError, setKnowledgeImportError] = useState<string | null>(null);
  const [knowledgeImportSummary, setKnowledgeImportSummary] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);
  const [isImportingKnowledge, setIsImportingKnowledge] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [personaResponse, providerResponse] = await Promise.all([
          fetch("/api/personas"),
          fetch("/api/providers")
        ]);
        const personaPayload = (await personaResponse.json()) as ApiResult<PersonaProfile[]>;
        const providerPayload = (await providerResponse.json()) as ApiResult<PublicModelProfile[]>;

        if (!personaPayload.ok) {
          throw new Error(personaPayload.error || text.loadPersonasFailed);
        }

        if (!providerPayload.ok) {
          throw new Error(providerPayload.error || text.loadProvidersFailed);
        }

        if (!cancelled) {
          setPersonas(personaPayload.data);
          setProviders(providerPayload.data);

          const defaultProvider = providerPayload.data.find((provider) => provider.isDefault && provider.configured)
            ?? providerPayload.data.find((provider) => provider.configured);

          if (defaultProvider) {
            setProviderId(defaultProvider.id);
          }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : text.loadProvidersFailed);
        }
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const initial = readInitialLocalWorkspace();
    setProfiles(initial.profiles);
    setActiveProfileId(initial.activeProfile.id);
    setProfileNameDraft(initial.activeProfile.name);
    setUserContext(initial.userContext);
    setHistoryEntries(initial.historyEntries);
    setFavorites(initial.favorites);
    setFeedbackEntries(initial.feedbackEntries);
    setHasLoadedMemory(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedMemory || !activeProfileId) {
      return;
    }

    writeStorageValue(activeProfileStorageKey, activeProfileId);
    writeStorageValue(profileUserContextStorageKey(activeProfileId), userContext);
    writeStorageValue(profileHistoryStorageKey(activeProfileId), historyEntries);
    writeStorageValue(profileFavoritesStorageKey(activeProfileId), favorites);
    writeStorageValue(profileFeedbackStorageKey(activeProfileId), feedbackEntries);
  }, [activeProfileId, favorites, feedbackEntries, hasLoadedMemory, historyEntries, userContext]);

  useEffect(() => {
    if (!hasLoadedMemory) {
      return;
    }

    writeStorageValue(profilesStorageKey, profiles);
  }, [hasLoadedMemory, profiles]);

  const selectedProvider = providerId ? providers.find((provider) => provider.id === providerId) : null;
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
  const validationCandidates: Array<string | null> = [
    query.trim().length > 0 && query.trim().length < 8 ? text.queryTooShort : null,
    query.length > 800 ? text.queryTooLong : null,
    !userContext.useCase?.trim() && !userContext.preference?.trim() ? text.preferenceEmpty : null,
    selectedProvider && !selectedProvider.configured ? text.providerNotConfigured : null
  ];
  const validationMessages = validationCandidates.filter((message): message is string => Boolean(message));
  const filteredFavorites = filterFavoriteAnswers(favorites, favoritePersonaFilter, favoriteTopicFilter);

  const persistActiveProfile = () => {
    if (!activeProfileId) {
      return;
    }

    writeStorageValue(profileUserContextStorageKey(activeProfileId), userContext);
    writeStorageValue(profileHistoryStorageKey(activeProfileId), historyEntries);
    writeStorageValue(profileFavoritesStorageKey(activeProfileId), favorites);
    writeStorageValue(profileFeedbackStorageKey(activeProfileId), feedbackEntries);
  };

  const loadProfileData = (profile: LocalWorkspaceProfile) => {
    setActiveProfileId(profile.id);
    setProfileNameDraft(profile.name);
    setUserContext(readProfileUserContext(profile.id, {}));
    setHistoryEntries(readProfileHistory(profile.id, []));
    setFavorites(readProfileFavorites(profile.id, []));
    setFeedbackEntries(readProfileFeedback(profile.id, []));
    setFavoritePersonaFilter("");
    setFavoriteTopicFilter("");
  };

  const buildCurrentSettings = () => ({
    query,
    inputMode,
    variantsCount,
    explanationModes,
    aiIntervention,
    retrievalMode,
    personaId,
    providerId,
    userContext
  });

  const handleSubmit = async () => {
    setError(null);
    setActionMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query,
          inputMode,
          personaId: personaId || null,
          providerId: providerId || null,
          variantsCount,
          explanationModes,
          aiIntervention,
          retrievalMode,
          userContext
        })
      });

      const payload = (await response.json()) as ApiResult<GenerateResponse>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setResult(payload.data);
      const historyEntry = createHistoryEntry({
        id: createLocalId("history"),
        createdAt: new Date().toISOString(),
        settings: buildCurrentSettings(),
        result: payload.data,
        providerLabel: selectedProvider?.label
      });
      setHistoryEntries((current) => upsertHistoryEntry(current, historyEntry));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.generationFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKnowledgeSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    setKnowledgeError(null);
    setIsSearchingKnowledge(true);

    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(trimmedQuery)}&topK=4`);
      const payload = (await response.json()) as ApiResult<SourceRef[]>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }
      setKnowledgeRefs(payload.data);
    } catch (cause) {
      setKnowledgeError(cause instanceof Error ? cause.message : text.knowledgeSearchFailed);
    } finally {
      setIsSearchingKnowledge(false);
    }
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setActionMessage(text.copied);
    } catch {
      setActionMessage(text.copyFailed);
    }
  };

  const handleExportMarkdown = () => {
    if (!result) {
      return;
    }

    downloadTextFile("wenyan-answer.md", formatGenerationMarkdown({ query, result }), "text/markdown;charset=utf-8");
    setActionMessage(text.exported);
  };

  const handleExportJson = () => {
    if (!result) {
      return;
    }

    downloadTextFile("wenyan-answer.json", formatGenerationJson({ query, result }), "application/json;charset=utf-8");
    setActionMessage(text.exported);
  };

  const handleUseHistory = (entry: QuestionHistoryEntry) => {
    setQuery(entry.query);
    setInputMode(entry.inputMode);
    setVariantsCount(entry.variantsCount);
    setExplanationModes(entry.explanationModes);
    setAiIntervention(entry.aiIntervention);
    setRetrievalMode(entry.retrievalMode);
    setPersonaId(entry.personaId);
    setProviderId(entry.providerId);
    setUserContext(entry.userContext);
    setActionMessage(text.historyApplied);
  };

  const handleClearHistory = () => {
    setHistoryEntries([]);
    setActionMessage(text.historyCleared);
  };

  const handleToggleFavorite = (variant: VariantResult) => {
    if (!result) {
      return;
    }

    const favorite = createFavoriteAnswer({
      id: createLocalId("favorite"),
      createdAt: new Date().toISOString(),
      query,
      result,
      variant
    });
    const wasFavorite = favorites.some((item) => item.favoriteKey === favorite.favoriteKey);
    setFavorites((current) => toggleFavoriteAnswer(current, favorite));
    setActionMessage(wasFavorite ? text.favoriteRemoved : text.favorited);
  };

  const handleExportFavorite = (favorite: FavoriteAnswer) => {
    downloadTextFile("wenyan-favorite.md", formatFavoriteMarkdown(favorite), "text/markdown;charset=utf-8");
    setActionMessage(text.exported);
  };

  const handleUseFavoriteQuery = (favorite: FavoriteAnswer) => {
    setQuery(favorite.query);
    setPersonaId(favorite.personaId);
    setActionMessage(text.historyApplied);
  };

  const handleSelectProfile = (profileId: string) => {
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile || profile.id === activeProfileId) {
      return;
    }

    persistActiveProfile();
    loadProfileData(profile);
    setActionMessage(text.profileSwitched);
  };

  const handleCreateProfile = () => {
    persistActiveProfile();
    const createdAt = new Date().toISOString();
    const profile = createLocalWorkspaceProfile({
      id: createLocalId("profile"),
      name: `本机用户 ${profiles.length + 1}`,
      createdAt
    });

    setProfiles((current) => [...current, profile]);
    writeStorageValue(profileUserContextStorageKey(profile.id), {});
    writeStorageValue(profileHistoryStorageKey(profile.id), []);
    writeStorageValue(profileFavoritesStorageKey(profile.id), []);
    writeStorageValue(profileFeedbackStorageKey(profile.id), []);
    loadProfileData(profile);
    setActionMessage(text.profileCreated);
  };

  const handleRenameProfile = () => {
    if (!activeProfile) {
      return;
    }

    const now = new Date().toISOString();
    const name = normalizeProfileName(profileNameDraft, activeProfile.name);
    setProfiles((current) => current.map((profile) => (
      profile.id === activeProfile.id ? { ...profile, name, updatedAt: now } : profile
    )));
    setProfileNameDraft(name);
    setActionMessage(text.profileRenamed);
  };

  const handleDeleteProfile = () => {
    if (!activeProfile) {
      return;
    }

    if (profiles.length <= 1) {
      setActionMessage(text.profileDeleteBlocked);
      return;
    }

    const remaining = profiles.filter((profile) => profile.id !== activeProfile.id);
    const nextProfile = remaining[0];
    removeProfileStorage(activeProfile.id);
    setProfiles(remaining);
    loadProfileData(nextProfile);
    setActionMessage(text.profileDeleted);
  };

  const handleExportProfileBackup = () => {
    if (!activeProfile) {
      return;
    }

    const backup = createProfileBackup({
      exportedAt: new Date().toISOString(),
      profile: activeProfile,
      userContext,
      historyEntries,
      favorites,
      feedbackEntries
    });

    downloadTextFile(
      `${normalizeProfileName(activeProfile.name, "profile")}-backup.json`,
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8"
    );
    setActionMessage(text.profileBackupExported);
  };

  const handleImportProfileBackup = async (file: File) => {
    const backup = parseProfileBackup(await file.text());
    if (!backup) {
      setActionMessage(text.profileBackupInvalid);
      return;
    }

    persistActiveProfile();
    const now = new Date().toISOString();
    const importedProfile = createLocalWorkspaceProfile({
      id: createLocalId("profile"),
      name: `${backup.profile.name} 导入`,
      createdAt: now
    });

    setProfiles((current) => [...current, importedProfile]);
    writeStorageValue(profileUserContextStorageKey(importedProfile.id), backup.userContext);
    writeStorageValue(profileHistoryStorageKey(importedProfile.id), backup.historyEntries);
    writeStorageValue(profileFavoritesStorageKey(importedProfile.id), backup.favorites);
    writeStorageValue(profileFeedbackStorageKey(importedProfile.id), backup.feedbackEntries ?? []);
    loadProfileData(importedProfile);
    setUserContext(backup.userContext);
    setHistoryEntries(backup.historyEntries);
    setFavorites(backup.favorites);
    setFeedbackEntries(backup.feedbackEntries ?? []);
    setActionMessage(text.profileBackupImported);
  };

  const handleImportKnowledge = async (documents: KnowledgeImportInput[]) => {
    setKnowledgeImportError(null);
    setKnowledgeImportSummary(null);
    setIsImportingKnowledge(true);

    try {
      const response = await fetch("/api/knowledge/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ documents })
      });
      const payload = (await response.json()) as ApiResult<KnowledgeImportResult>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setKnowledgeRefs([]);
      setKnowledgeImportSummary(`${text.knowledgeImported}${payload.data.imported} 篇，chunks=${payload.data.processedChunks}，vectors=${payload.data.vectorDocuments}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : text.knowledgeImportFailed;
      setKnowledgeImportError(message);
      throw new Error(message);
    } finally {
      setIsImportingKnowledge(false);
    }
  };

  const handleSubmitFeedback = (variant: VariantResult, rating: FeedbackRating) => {
    if (!result) {
      return;
    }

    const entry = createFeedbackEntry({
      id: createLocalId("feedback"),
      createdAt: new Date().toISOString(),
      query,
      result,
      variant,
      rating
    });

    setFeedbackEntries((current) => upsertFeedbackEntry(current, entry));
    setActionMessage(text.feedbackSaved);
  };

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">{text.heroEyebrow}</p>
        <h1>{text.heroTitle}</h1>
        <p className="hero-copy">{text.heroCopy}</p>
      </section>

      <div className="workspace-grid">
        <aside className="workspace-sidebar">
          <ChatInput
            query={query}
            inputMode={inputMode}
            variantsCount={variantsCount}
            explanationModes={explanationModes}
            aiIntervention={aiIntervention}
            retrievalMode={retrievalMode}
            userContext={userContext}
            personaId={personaId}
            providerId={providerId}
            personas={personas}
            providers={providers}
            knowledgeRefs={knowledgeRefs}
            knowledgeError={knowledgeError}
            knowledgeSearching={isSearchingKnowledge}
            validationMessages={validationMessages}
            disabled={isSubmitting}
            onQueryChange={setQuery}
            onInputModeChange={setInputMode}
            onVariantsCountChange={setVariantsCount}
            onExplanationModesChange={setExplanationModes}
            onAiInterventionChange={setAiIntervention}
            onRetrievalModeChange={setRetrievalMode}
            onUserContextChange={setUserContext}
            onPersonaChange={setPersonaId}
            onProviderChange={setProviderId}
            onKnowledgeSearch={() => {
              void handleKnowledgeSearch();
            }}
            onSubmit={() => {
              void handleSubmit();
            }}
          />

          <WorkspaceMemoryPanel
            profiles={profiles}
            activeProfileId={activeProfileId}
            profileNameDraft={profileNameDraft}
            historyEntries={historyEntries}
            favorites={filteredFavorites}
            personas={personas}
            personaFilter={favoritePersonaFilter}
            topicFilter={favoriteTopicFilter}
            onProfileChange={handleSelectProfile}
            onProfileNameDraftChange={setProfileNameDraft}
            onCreateProfile={handleCreateProfile}
            onRenameProfile={handleRenameProfile}
            onDeleteProfile={handleDeleteProfile}
            onExportProfileBackup={handleExportProfileBackup}
            onImportProfileBackup={(file) => {
              void handleImportProfileBackup(file);
            }}
            onPersonaFilterChange={setFavoritePersonaFilter}
            onTopicFilterChange={setFavoriteTopicFilter}
            onUseHistory={handleUseHistory}
            onRemoveHistory={(id) => setHistoryEntries((current) => current.filter((entry) => entry.id !== id))}
            onClearHistory={handleClearHistory}
            onUseFavoriteQuery={handleUseFavoriteQuery}
            onRemoveFavorite={(favoriteKey) => setFavorites((current) => current.filter((item) => item.favoriteKey !== favoriteKey))}
            onExportFavorite={handleExportFavorite}
          />

          <KnowledgeImportPanel
            disabled={isSubmitting}
            importing={isImportingKnowledge}
            importError={knowledgeImportError}
            importSummary={knowledgeImportSummary}
            onImport={handleImportKnowledge}
          />
        </aside>

        <section className="results-column">
          {error ? <div className="panel error-panel">{error}</div> : null}
          {actionMessage ? <div className="panel toast-panel">{actionMessage}</div> : null}

          {result ? (
            <>
              <section className="panel summary-panel">
                <div className="summary-toolbar">
                  <div>
                    <p className="eyebrow">{text.previewEyebrow}</p>
                    <h2>{text.resultTitle}</h2>
                  </div>
                  <div className="summary-actions">
                    <button type="button" className="small-button" onClick={handleExportMarkdown}>
                      {text.exportMarkdown}
                    </button>
                    <button type="button" className="small-button" onClick={handleExportJson}>
                      {text.exportJson}
                    </button>
                  </div>
                </div>
                <div className="summary-grid">
                  <article>
                    <p className="eyebrow">{text.normalizedQuery}</p>
                    <h2>{result.normalizedQuery}</h2>
                  </article>
                  <article>
                    <p className="eyebrow">{text.detectedMode}</p>
                    <p>{result.detectedInputMode === "classical" ? text.classical : text.vernacular}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.provider}</p>
                    <p>{formatProvider(result.debug?.provider)}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.persona}</p>
                    <p>{result.persona?.name ?? text.genericPersona}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.aiIntervention}</p>
                    <p>{formatAiIntervention(result.debug?.aiIntervention)}</p>
                  </article>
                  <article>
                    <p className="eyebrow">{text.retrievalMode}</p>
                    <p>{formatRetrievalMode(result.debug?.retrievalMode)}</p>
                  </article>
                </div>
                {result.debug?.normalizationNotes?.length ? (
                  <p className="summary-notes">{result.debug.normalizationNotes.join(text.notesSeparator)}</p>
                ) : null}
              </section>

              {result.variants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  retrievalRefs={result.retrievalRefs}
                  isFavorite={favorites.some((favorite) => favorite.favoriteKey === createFavoriteKey({
                    normalizedQuery: result.normalizedQuery,
                    personaId: result.persona?.id,
                    classicalText: variant.classicalText
                  }))}
                  onCopyClassical={(item) => {
                    void copyText(item.classicalText);
                  }}
                  onCopyExplanation={(item) => {
                    void copyText(formatVariantMarkdown(item));
                  }}
                  onCopySources={(item) => {
                    void copyText(formatSourcesMarkdown(item.sources));
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  feedbackRating={feedbackEntries.find((entry) => entry.feedbackKey === createFeedbackKey({
                    normalizedQuery: result.normalizedQuery,
                    variantId: variant.id,
                    classicalText: variant.classicalText
                  }))?.rating}
                  onSubmitFeedback={handleSubmitFeedback}
                />
              ))}
            </>
          ) : (
            <section className="panel empty-panel">
              <p className="eyebrow">{text.previewEyebrow}</p>
              <h2>{text.previewTitle}</h2>
              <p>{text.previewCopy}</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
