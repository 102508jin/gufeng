"use client";

import { useEffect, useState } from "react";

import { ChatInput } from "@/components/chat-input";
import { KnowledgeImportPanel } from "@/components/knowledge-import-panel";
import { ProviderSettingsDialog } from "@/components/provider-settings-dialog";
import { VariantCard } from "@/components/variant-card";
import {
  COMPLETION_TOKEN_BUDGET_STEP,
  DEFAULT_AI_INTERVENTION,
  DEFAULT_COMPLETION_TOKEN_BUDGET,
  DEFAULT_EXPLANATION_MODES,
  DEFAULT_RETRIEVAL_MODE,
  DEFAULT_VARIANTS_COUNT,
  MAX_COMPLETION_TOKEN_BUDGET,
  MIN_COMPLETION_TOKEN_BUDGET
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
import type { ProviderEndpointOverrides, PublicModelProfile } from "@/lib/types/provider";
import type { SourceRef } from "@/lib/types/retrieval";
import type { KnowledgeImportInput, KnowledgeImportResult } from "@/lib/types/knowledge-import";
import type { ProviderConnectionTestResult } from "@/lib/services/provider-connection-service";
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
const providerSettingsStorageKey = "wenyan-agent:provider-settings:v1";

type ProviderSettingsState = {
  openaiBaseUrl: string;
  anthropicBaseUrl: string;
  maxCompletionTokens: number;
};

type WorkspaceView = "workbench" | "knowledge" | "memory" | "providers";
type MemoryView = "history" | "favorites";

const emptyProviderSettings: ProviderSettingsState = {
  openaiBaseUrl: "",
  anthropicBaseUrl: "",
  maxCompletionTokens: DEFAULT_COMPLETION_TOKEN_BUDGET
};

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
  previewTitle: "\u9759\u5019\u5782\u8be2",
  previewCopy: "\u5728\u5de6\u4fa7\u8f93\u5165\u95ee\u9898\uff0c\u6216\u9009\u7528\u4e0b\u65b9\u793a\u4f8b\uff0c\u5373\u53ef\u751f\u6210\u6587\u8a00\u7b54\u590d\u3001\u767d\u8bdd\u89e3\u6790\u4e0e\u6765\u6e90\u6eaf\u6e90\u3002",
  generatingTitle: "\u7814\u58a8\u94fa\u7eb8\uff0c\u63a8\u6572\u6587\u7406...",
  generatingCopy: "\u6b63\u5728\u7efc\u5408\u89d2\u8272\u98ce\u683c\u3001\u6da6\u8272\u529b\u5ea6\u4e0e\u5178\u7c4d\u68c0\u7d22\u7ed3\u679c\uff0c\u8bf7\u7a0d\u5019\u3002",
  sampleQuestion: "\u8bd5\u7528\u793a\u4f8b",
  navWorkbench: "\u5de5\u4f5c\u53f0",
  navKnowledge: "\u77e5\u8bc6\u5e93",
  navMemory: "\u5386\u53f2\u6536\u85cf",
  navProviders: "\u6a21\u578b\u8bbe\u7f6e",
  knowledgePageTitle: "\u77e5\u8bc6\u5e93\u7ba1\u7406",
  knowledgePageCopy: "\u7ba1\u7406\u5bfc\u5165\u7684\u8bed\u6599\u548c\u5411\u91cf\u7d22\u5f15\uff0c\u5e76\u5728\u751f\u6210\u524d\u9884\u68c0\u68c0\u7d22\u6548\u679c\u3002",
  memoryPageTitle: "\u5386\u53f2\u4e0e\u6536\u85cf",
  memoryPageCopy: "\u67e5\u770b\u6700\u8fd1\u63d0\u95ee\u3001\u590d\u7528\u751f\u6210\u8bbe\u7f6e\uff0c\u7ba1\u7406\u5df2\u6536\u85cf\u7684\u56de\u7b54\u3002",
  providersPageTitle: "\u6a21\u578b\u4e0e\u63a5\u53e3",
  providersPageCopy: "\u67e5\u770b\u5f53\u524d\u53ef\u7528\u7684\u6a21\u578b\u670d\u52a1\u5546\uff0c\u5e76\u8c03\u6574\u5f53\u524d\u6d4f\u89c8\u5668\u7684\u63a5\u53e3\u8986\u76d6\u3002",
  configured: "\u5df2\u914d\u7f6e",
  unavailable: "\u672a\u914d\u7f6e",
  defaultProvider: "\u9ed8\u8ba4",
  customOverride: "\u5df2\u8986\u76d6",
  openProviderSettings: "\u6253\u5f00\u63a5\u53e3\u8bbe\u7f6e",
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

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
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

function trimStoredValue(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\/+$/u, "") : "";
}

function clampCompletionTokenBudget(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return DEFAULT_COMPLETION_TOKEN_BUDGET;
  }

  const stepped = Math.round(numeric / COMPLETION_TOKEN_BUDGET_STEP) * COMPLETION_TOKEN_BUDGET_STEP;
  return Math.min(MAX_COMPLETION_TOKEN_BUDGET, Math.max(MIN_COMPLETION_TOKEN_BUDGET, stepped));
}

function formatTokenBudget(value: number): string {
  return `${Math.round(value / 1024)}k`;
}

function readStoredProviderSettings(): ProviderSettingsState {
  try {
    const raw = window.localStorage.getItem(providerSettingsStorageKey);
    if (!raw) {
      return emptyProviderSettings;
    }

    const parsed = JSON.parse(raw) as Partial<ProviderSettingsState>;
    return {
      openaiBaseUrl: trimStoredValue(parsed.openaiBaseUrl),
      anthropicBaseUrl: trimStoredValue(parsed.anthropicBaseUrl),
      maxCompletionTokens: clampCompletionTokenBudget(parsed.maxCompletionTokens)
    };
  } catch {
    return emptyProviderSettings;
  }
}

function getProviderDefaults(providers: PublicModelProfile[]): ProviderSettingsState {
  const openai = providers.find((provider) => provider.id === "openai");
  const anthropic = providers.find((provider) => provider.id === "anthropic");

  return {
    openaiBaseUrl: openai?.baseUrl ?? "",
    anthropicBaseUrl: anthropic?.baseUrl ?? "",
    maxCompletionTokens: DEFAULT_COMPLETION_TOKEN_BUDGET
  };
}

function toRequestProviderOverrides(value: ProviderSettingsState): ProviderEndpointOverrides | undefined {
  const overrides: ProviderEndpointOverrides = {};

  if (value.openaiBaseUrl) {
    overrides.openaiBaseUrl = value.openaiBaseUrl;
  }

  if (value.anthropicBaseUrl) {
    overrides.anthropicBaseUrl = value.anthropicBaseUrl;
  }

  overrides.maxCompletionTokens = clampCompletionTokenBudget(value.maxCompletionTokens);

  return Object.keys(overrides).length ? overrides : undefined;
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
  const [activeView, setActiveView] = useState<WorkspaceView>("workbench");
  const [query, setQuery] = useState("");
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
  const [providerDefaults, setProviderDefaults] = useState<ProviderSettingsState>(emptyProviderSettings);
  const [providerSettings, setProviderSettings] = useState<ProviderSettingsState>(emptyProviderSettings);
  const [historyEntries, setHistoryEntries] = useState<QuestionHistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAnswer[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [memoryView, setMemoryView] = useState<MemoryView>("history");
  const [favoritePersonaFilter, setFavoritePersonaFilter] = useState("");
  const [favoriteTopicFilter, setFavoriteTopicFilter] = useState("");
  const [knowledgeRefs, setKnowledgeRefs] = useState<SourceRef[]>([]);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [knowledgeImportError, setKnowledgeImportError] = useState<string | null>(null);
  const [knowledgeImportSummary, setKnowledgeImportSummary] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [connectionTest, setConnectionTest] = useState<ProviderConnectionTestResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);
  const [isImportingKnowledge, setIsImportingKnowledge] = useState(false);
  const [isReindexingKnowledge, setIsReindexingKnowledge] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          setProviderDefaults(getProviderDefaults(providerPayload.data));
          setProviderSettings(readStoredProviderSettings());

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

  useEffect(() => {
    if (!hasLoadedMemory || memoryView !== "history" || historyEntries.length || !favorites.length) {
      return;
    }

    setMemoryView("favorites");
  }, [favorites.length, hasLoadedMemory, historyEntries.length, memoryView]);

  useEffect(() => {
    setConnectionTest(null);
  }, [providerId]);

  const selectedProvider = providerId ? providers.find((provider) => provider.id === providerId) : null;
  const selectedProviderBaseUrl = selectedProvider?.id === "openai" && providerSettings.openaiBaseUrl
    ? providerSettings.openaiBaseUrl
    : selectedProvider?.id === "anthropic" && providerSettings.anthropicBaseUrl
      ? providerSettings.anthropicBaseUrl
      : selectedProvider?.baseUrl ?? providerDefaults.openaiBaseUrl ?? "http://localhost:11434/v1";
  const connectionStatusDetail = isTestingConnection
    ? "正在测试连接..."
    : connectionTest
      ? connectionTest.detail
      : `${formatProvider(selectedProvider?.driver)} · ${selectedProvider?.configured ? text.configured : text.unavailable}`;
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;
  const validationCandidates: Array<string | null> = [
    query.trim().length > 0 && query.trim().length < 8 ? text.queryTooShort : null,
    query.length > 800 ? text.queryTooLong : null,
    !userContext.useCase?.trim() && !userContext.preference?.trim() ? text.preferenceEmpty : null,
    selectedProvider && !selectedProvider.configured ? text.providerNotConfigured : null
  ];
  const validationMessages = validationCandidates.filter((message): message is string => Boolean(message));
  const filteredFavorites = filterFavoriteAnswers(favorites, favoritePersonaFilter, favoriteTopicFilter);

  const persistProviderSettings = (value: ProviderSettingsState) => {
    setProviderSettings(value);
    writeStorageValue(providerSettingsStorageKey, value);
    setConnectionTest(null);
  };

  const updateCompletionTokenBudget = (value: number) => {
    persistProviderSettings({
      ...providerSettings,
      maxCompletionTokens: clampCompletionTokenBudget(value)
    });
  };

  const resetProviderSettings = () => {
    persistProviderSettings(emptyProviderSettings);
  };

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
    setMemoryView("history");
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
    providerOverrides: toRequestProviderOverrides(providerSettings),
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
          providerOverrides: toRequestProviderOverrides(providerSettings),
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

  const handleTestProviderConnection = async () => {
    setConnectionTest(null);
    setIsTestingConnection(true);

    try {
      const response = await fetch("/api/providers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          providerId: providerId || null,
          providerOverrides: toRequestProviderOverrides(providerSettings)
        })
      });

      const payload = (await response.json()) as ApiResult<ProviderConnectionTestResult>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setConnectionTest(payload.data);
    } catch (cause) {
      setConnectionTest({
        ok: false,
        configured: false,
        providerId: providerId || "",
        provider: selectedProvider?.label ?? "当前模型",
        driver: selectedProvider?.driver ?? "mock",
        baseUrl: selectedProvider?.baseUrl,
        maxCompletionTokens: providerSettings.maxCompletionTokens,
        detail: cause instanceof Error ? cause.message : "连接测试失败。"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleNewSession = () => {
    setQuery("");
    setResult(null);
    setError(null);
    setActionMessage(null);
    setKnowledgeRefs([]);
    setKnowledgeError(null);
    setActiveView("workbench");
  };

  const navigationItems: Array<{ id: WorkspaceView; label: string }> = [
    { id: "workbench", label: text.navWorkbench },
    { id: "knowledge", label: text.navKnowledge },
    { id: "memory", label: text.navMemory },
    { id: "providers", label: text.navProviders }
  ];

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
    persistProviderSettings({
      openaiBaseUrl: entry.providerOverrides?.openaiBaseUrl ?? "",
      anthropicBaseUrl: entry.providerOverrides?.anthropicBaseUrl ?? "",
      maxCompletionTokens: clampCompletionTokenBudget(entry.providerOverrides?.maxCompletionTokens)
    });
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

  const handleReindexKnowledge = async () => {
    setKnowledgeError(null);
    setIsReindexingKnowledge(true);

    try {
      const response = await fetch("/api/knowledge/reindex", {
        method: "POST"
      });
      const payload = (await response.json()) as ApiResult<{
        knowledge: number;
        vectorDocuments: number;
        embeddingProvider: string;
      }>;
      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setKnowledgeRefs([]);
      setKnowledgeImportSummary(
        `索引已更新：knowledge=${payload.data.knowledge}，vectors=${payload.data.vectorDocuments}，embedding=${payload.data.embeddingProvider}`
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "重新索引失败。";
      setKnowledgeError(message);
    } finally {
      setIsReindexingKnowledge(false);
    }
  };

  const handleDeleteKnowledgeSource = (name: string) => {
    if (name === "user-import") {
      setKnowledgeImportSummary(null);
      setKnowledgeRefs([]);
      setKnowledgeError(null);
      setActionMessage("已清除本次导入状态；如需删除原始导入文件，请在本地语料目录处理后重新索引。");
      return;
    }

    setActionMessage("内置知识文件受本地语料保护，不能从前端直接删除；请在 data/raw/knowledge 中管理后重新索引。");
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
    <main className="app-frame">
      <aside className="app-sidebar" aria-label="主导航">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p>古风问答</p>
            <span>文言研习工作台</span>
          </div>
        </div>

        <button type="button" className="new-session-button" onClick={handleNewSession} disabled={isSubmitting}>
          ＋ 新建会话
        </button>

        <nav className="sidebar-nav" aria-label="工作台模块">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link sidebar-link-button ${activeView === item.id ? "sidebar-link-active" : ""}`}
              onClick={() => setActiveView(item.id)}
              aria-current={activeView === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status">
          <p>向量状态</p>
          <span>{formatRetrievalMode(retrievalMode)} · {formatProvider(selectedProvider?.driver ?? result?.debug?.provider)}</span>
        </div>
      </aside>

      <section className="page-shell">
        <header className="app-topbar">
          <div className="app-brand">
            <p className="eyebrow">{text.heroEyebrow}</p>
            <h1>
              {activeView === "knowledge"
                ? text.knowledgePageTitle
                : activeView === "memory"
                  ? text.memoryPageTitle
                  : activeView === "providers"
                    ? text.providersPageTitle
                    : "书香工作台"}
            </h1>
          </div>
          <div className="top-action-row" aria-label="workspace tools">
            <label className="top-search">
              <span className="sr-only">搜索</span>
              <input placeholder="搜索..." />
            </label>
            <button type="button" aria-label="同步状态">↻</button>
            <button type="button" aria-label="帮助">?</button>
            <button type="button" aria-label="本地配置档">◎</button>
          </div>
        </header>

        {activeView === "workbench" ? (
          <div className="workbench-grid">
            <aside className="input-rail">
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
                hasCustomProviderSettings={Boolean(providerSettings.openaiBaseUrl || providerSettings.anthropicBaseUrl)}
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
                onOpenSettings={() => setActiveView("providers")}
                onKnowledgeSearch={() => {
                  void handleKnowledgeSearch();
                }}
                onSubmit={() => {
                  void handleSubmit();
                }}
              />
            </aside>

            <section className="results-column workspace-main">
              {error ? <div className="panel error-panel">{error}</div> : null}
              {actionMessage ? <div className="panel toast-panel">{actionMessage}</div> : null}

              {isSubmitting ? (
                <section className="panel empty-panel generating-panel" aria-live="polite">
                  <p className="eyebrow">{text.previewEyebrow}</p>
                  <h2>{text.generatingTitle}</h2>
                  <p>{text.generatingCopy}</p>
                  <div className="progress-steps" aria-label="生成进度">
                    <span>检索典籍</span>
                    <span>生成文言</span>
                    <span>整理溯源</span>
                  </div>
                </section>
              ) : result ? (
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
                    <details className="summary-details">
                      <summary>{text.previewEyebrow}</summary>
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
                    </details>
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
                  <button type="button" className="small-button sample-question-button" onClick={() => setQuery(starterQuestion)}>
                    {text.sampleQuestion}
                  </button>
                </section>
              )}
            </section>
          </div>
        ) : null}

        {activeView === "knowledge" ? (
          <section className="section-page knowledge-page">
            <div className="section-page-main">
              <div className="page-intro">
                <p className="eyebrow">Knowledge</p>
                <h2>{text.knowledgePageTitle}</h2>
                <p>{text.knowledgePageCopy}</p>
              </div>

              <div className="stitch-toolbar">
                <div className="stitch-filter-row">
                  <button type="button" className="small-button">所有类型</button>
                  <button type="button" className="small-button">所有状态</button>
                </div>
                <details className="stitch-import-disclosure">
                  <summary className="primary-button compact-button">导入新文档</summary>
                  <KnowledgeImportPanel
                    disabled={isSubmitting}
                    importing={isImportingKnowledge}
                    importError={knowledgeImportError}
                    importSummary={knowledgeImportSummary}
                    onImport={handleImportKnowledge}
                  />
                </details>
              </div>

              {actionMessage ? <div className="panel toast-panel section-toast">{actionMessage}</div> : null}
              {knowledgeImportSummary ? <p className="inline-success section-inline-message">{knowledgeImportSummary}</p> : null}

              <section className="stitch-table-panel">
                <div className="knowledge-table knowledge-table-head">
                  <span>文件名称</span>
                  <span>类型</span>
                  <span>大小</span>
                  <span>状态</span>
                  <span>操作</span>
                </div>

                {[
                  ["local-corpus.json", "JSON", "已生成", "已向量化"],
                  ["vector-index.json", "INDEX", "本地", "可检索"],
                  ["user-import", "TXT/JSON", "动态", knowledgeImportSummary ? "已更新" : "待导入"]
                ].map(([name, type, size, status]) => (
                  <article key={name} className="knowledge-table knowledge-table-row">
                    <strong>{name}</strong>
                    <span>{type}</span>
                    <span>{size}</span>
                    <span className="table-status">{status}</span>
                    <span className="table-actions">
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => {
                          void handleReindexKnowledge();
                        }}
                        disabled={isReindexingKnowledge}
                      >
                        {isReindexingKnowledge ? "索引中" : "重新索引"}
                      </button>
                      <button
                        type="button"
                        className="table-action-button danger"
                        onClick={() => handleDeleteKnowledgeSource(name)}
                      >
                        删除
                      </button>
                    </span>
                  </article>
                ))}
              </section>
            </div>

            <aside className="section-page-side">
              <section className="panel knowledge-precheck-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">检索预检</p>
                    <h2>测试召回效果</h2>
                  </div>
                </div>
                <label className="field-group">
                  <span className="field-label">查询文本</span>
                  <textarea
                    className="field-input field-textarea compact-textarea"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="输入中文查询..."
                  />
                </label>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    void handleKnowledgeSearch();
                  }}
                  disabled={!query.trim() || isSearchingKnowledge}
                >
                  {isSearchingKnowledge ? "检索中..." : "运行检索测试"}
                </button>
                {knowledgeError ? <p className="inline-error">{knowledgeError}</p> : null}
                <div className="retrieval-list">
                  {knowledgeRefs.map((refItem) => (
                    <article key={refItem.id} className="retrieval-card">
                      <p className="source-tag">得分：{refItem.score.toFixed(2)}</p>
                      <h5>{refItem.title}</h5>
                      <p>{refItem.excerpt}</p>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        ) : null}

        {activeView === "memory" ? (
          <section className="section-page single-page">
            <div className="page-intro">
              <p className="eyebrow">Memory</p>
              <h2>{text.memoryPageTitle}</h2>
              <p>{text.memoryPageCopy}</p>
            </div>

            <div className="history-toolbar">
              <div className="segmented-row history-tabs" role="tablist" aria-label="历史收藏视图">
                <button
                  type="button"
                  role="tab"
                  aria-selected={memoryView === "history"}
                  className={`chip ${memoryView === "history" ? "chip-active" : ""}`}
                  onClick={() => setMemoryView("history")}
                >
                  历史
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={memoryView === "favorites"}
                  className={`chip ${memoryView === "favorites" ? "chip-active" : ""}`}
                  onClick={() => setMemoryView("favorites")}
                >
                  已收藏
                </button>
              </div>
              <div className="summary-actions">
                <button type="button" className="small-button" onClick={handleExportProfileBackup}>备份配置</button>
                {memoryView === "history" ? (
                  <button type="button" className="small-button" onClick={handleClearHistory} disabled={!historyEntries.length}>
                    清空历史
                  </button>
                ) : null}
              </div>
            </div>

            <section className="history-table">
              <div className="history-table-head">
                <span />
                <span>{memoryView === "history" ? "标题 / 摘要" : "文言 / 原题"}</span>
                <span>角色</span>
                <span>日期</span>
                <span>操作</span>
              </div>
              {memoryView === "history" && historyEntries.length ? historyEntries.map((entry) => (
                  <article key={entry.id} className="history-row">
                    <input type="checkbox" aria-label="选择历史记录" />
                    <button type="button" className="history-title" onClick={() => handleUseHistory(entry)}>
                      <strong>{entry.normalizedQuery}</strong>
                      <span>{entry.topics.length ? entry.topics.join("、") : "文言问答记录"}</span>
                    </button>
                    <span>{entry.personaName ?? text.genericPersona}</span>
                    <span>{formatShortDate(entry.createdAt)}</span>
                    <button type="button" className="ghost-button" onClick={() => setHistoryEntries((current) => current.filter((item) => item.id !== entry.id))}>删除</button>
                  </article>
                )) : null}
              {memoryView === "favorites" && filteredFavorites.length ? filteredFavorites.map((favorite) => (
                  <article key={favorite.favoriteKey} className="history-row favorite-row">
                    <input type="checkbox" aria-label="选择收藏记录" />
                    <button type="button" className="history-title" onClick={() => handleUseFavoriteQuery(favorite)}>
                      <strong>{favorite.classicalText}</strong>
                      <span>{favorite.normalizedQuery || favorite.query}</span>
                    </button>
                    <span>{favorite.personaName ?? text.genericPersona}</span>
                    <span>{formatShortDate(favorite.createdAt)}</span>
                    <div className="history-row-actions">
                      <button type="button" className="ghost-button" onClick={() => handleExportFavorite(favorite)}>导出</button>
                      <button type="button" className="ghost-button" onClick={() => setFavorites((current) => current.filter((item) => item.favoriteKey !== favorite.favoriteKey))}>移除</button>
                    </div>
                  </article>
                )) : null}
              {memoryView === "history" && !historyEntries.length ? (
                <article className="history-row history-row-empty">
                  <span />
                  <div className="history-title">
                    <strong>暂无研习记录</strong>
                    <span>生成回答后，最近提问会出现在此处。</span>
                  </div>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                </article>
              ) : null}
              {memoryView === "favorites" && !filteredFavorites.length ? (
                <article className="history-row history-row-empty">
                  <span />
                  <div className="history-title">
                    <strong>暂无收藏内容</strong>
                    <span>在工作台收藏回答后，会出现在此处。</span>
                  </div>
                  <span>—</span>
                  <span>—</span>
                  <span>—</span>
                </article>
              ) : null}
            </section>

            <details className="profile-disclosure">
              <summary>本地配置档</summary>
              <section className="panel memory-panel">
                <div className="profile-grid">
                  <select
                    className="field-input field-select"
                    value={activeProfileId}
                    onChange={(event) => handleSelectProfile(event.target.value)}
                  >
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field-input"
                    value={profileNameDraft}
                    onChange={(event) => setProfileNameDraft(event.target.value)}
                    placeholder="配置档名称"
                    maxLength={40}
                  />
                </div>
                <div className="memory-actions">
                  <button type="button" className="ghost-button" onClick={handleCreateProfile}>新建</button>
                  <button type="button" className="ghost-button" onClick={handleRenameProfile}>重命名</button>
                  <button type="button" className="ghost-button" onClick={handleDeleteProfile}>删除</button>
                  <button type="button" className="ghost-button" onClick={handleExportProfileBackup}>备份</button>
                  <label className="ghost-button file-button">
                    导入
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleImportProfileBackup(file);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              </section>
            </details>
          </section>
        ) : null}

        {activeView === "providers" ? (
          <section className="section-page provider-config-page">
            <section className="provider-config-card">
              <header className="provider-config-header">
                <span aria-hidden="true">⌘</span>
                <h2>{text.providersPageTitle}</h2>
              </header>
              <div className="provider-config-body">
                <section className="provider-config-section">
                  <p className="eyebrow">API 连接配置</p>
                  <label className="field-group">
                    <span className="field-label">大语言模型</span>
                    <select className="field-input field-select" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                      <option value="">跟随默认配置</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id} disabled={!provider.configured}>{provider.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field-group">
                    <span className="field-label">API 基础 URL</span>
                    <input className="field-input" value={selectedProviderBaseUrl} readOnly />
                  </label>
                </section>

                <section className="provider-config-section">
                  <p className="eyebrow">模型参数</p>
                  <label className="provider-token-field" htmlFor="provider-token-budget">
                    <span className="section-title-row">
                      <span>最大输出 Token</span>
                      <span className="range-value">{formatTokenBudget(providerSettings.maxCompletionTokens)}</span>
                    </span>
                    <span className="provider-slider-row">
                      <span>{formatTokenBudget(MIN_COMPLETION_TOKEN_BUDGET)}</span>
                      <input
                        id="provider-token-budget"
                        className="provider-token-range"
                        type="range"
                        min={MIN_COMPLETION_TOKEN_BUDGET}
                        max={MAX_COMPLETION_TOKEN_BUDGET}
                        step={COMPLETION_TOKEN_BUDGET_STEP}
                        value={providerSettings.maxCompletionTokens}
                        onChange={(event) => updateCompletionTokenBudget(Number(event.target.value))}
                      />
                      <span>{formatTokenBudget(MAX_COMPLETION_TOKEN_BUDGET)}</span>
                    </span>
                  </label>
                  <p className="provider-help">此值会随生成请求发送给模型，用于限制单次回复长度；上下文窗口仍以所选模型服务端能力为准。</p>
                </section>

                <section className={`provider-connection-card ${connectionTest ? (connectionTest.ok ? "provider-connection-ok" : "provider-connection-error") : ""}`}>
                  <div>
                    <strong>连接状态</strong>
                    <p>{connectionStatusDetail}</p>
                  </div>
                  <button
                    type="button"
                    className="small-button"
                    onClick={handleTestProviderConnection}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? "测试中..." : "测试连接"}
                  </button>
                </section>

                <div className="provider-card-grid">
                  {providers.map((provider) => (
                    <article key={provider.id} className="provider-card">
                      <div>
                        <p className="eyebrow">{provider.driver}</p>
                        <h3>{provider.label}</h3>
                      </div>
                      <span className={`provider-state ${provider.configured ? "provider-state-ready" : ""}`}>
                        {provider.configured ? text.configured : text.unavailable}
                      </span>
                    </article>
                  ))}
                </div>
              </div>
              <footer className="provider-config-footer">
                <span>配置保存在当前浏览器本地。</span>
                <div>
                  <button type="button" className="secondary-button compact-button" onClick={resetProviderSettings}>清空覆盖</button>
                  <button type="button" className="primary-button compact-button" onClick={() => setIsSettingsOpen(true)}>编辑接口</button>
                </div>
              </footer>
            </section>
          </section>
        ) : null}

        <ProviderSettingsDialog
        open={isSettingsOpen}
        value={providerSettings}
        defaults={providerDefaults}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(value) => {
          persistProviderSettings({
            ...providerSettings,
            ...value
          });
          setIsSettingsOpen(false);
        }}
      />
      </section>
    </main>
  );
}
