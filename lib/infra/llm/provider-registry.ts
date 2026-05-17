import { env } from "@/lib/config/env";
import { logger } from "@/lib/infra/logger";
import type { ModelDriver, ModelProfile, ProviderEndpointOverrides, PublicModelProfile } from "@/lib/types/provider";

type RawModelProfile = {
  id?: string;
  label?: string;
  driver?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  apiKeyEnv?: string;
  authHeader?: string;
  maxCompletionTokens?: number;
  headers?: Record<string, string>;
};

function normalizeDriver(driver: string | undefined): ModelDriver | null {
  switch (driver) {
    case "mock":
      return "mock";
    case "ollama":
      return "ollama";
    case "openai":
    case "openai-compatible":
    case "vllm":
    case "sglang":
    case "codex":
      return "openai-compatible";
    case "anthropic":
    case "claude":
      return "anthropic";
    default:
      return null;
  }
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function getCustomApiKey(profile: RawModelProfile): string | undefined {
  if (profile.apiKeyEnv) {
    return process.env[profile.apiKeyEnv] ?? "";
  }

  if (profile.apiKey) {
    logger.warn("已忽略 MODEL_PROFILES_JSON 中的内联 apiKey，请改用 apiKeyEnv 引用环境变量。", {
      profileId: profile.id
    });
    return "";
  }

  return undefined;
}

function normalizeBaseUrl(baseUrl: string | undefined | null): string | undefined {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/u, "");
}

function normalizeAuthHeader(value: string | undefined, baseUrl: string | undefined): ModelProfile["authHeader"] {
  if (value === "api-key" || value === "authorization") {
    return value;
  }

  return baseUrl?.includes("mimo") || baseUrl?.includes("xiaomimimo") ? "api-key" : "authorization";
}

function normalizeMaxCompletionTokens(value: number | undefined, baseUrl: string | undefined): number | undefined {
  if (Number.isFinite(value) && value && value > 0) {
    return Math.floor(value);
  }

  return baseUrl?.includes("mimo") || baseUrl?.includes("xiaomimimo") ? 1024 : undefined;
}

function normalizeOverrideMaxCompletionTokens(value: number | undefined): number | undefined {
  if (Number.isFinite(value) && value && value > 0) {
    return Math.floor(value);
  }

  return undefined;
}

function parseCustomProfiles(): ModelProfile[] {
  if (!env.modelProfilesJson.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(env.modelProfilesJson) as unknown;
    if (!Array.isArray(parsed)) {
      logger.warn("\u5df2\u5ffd\u7565 MODEL_PROFILES_JSON\uff0c\u539f\u56e0\u4e3a\u5176\u4e0d\u662f\u6570\u7ec4\u3002");
      return [];
    }

    return parsed.flatMap((item) => {
      const profile = item as RawModelProfile & { enabled?: boolean };
      const driver = normalizeDriver(profile.driver);

      if (!driver || !profile.id || !profile.label) {
        return [];
      }

      if (!toBoolean(profile.enabled, true)) {
        return [];
      }

      const baseUrl = normalizeBaseUrl(profile.baseUrl);

      return [{
        id: profile.id,
        label: profile.label,
        driver,
        model: profile.model,
        baseUrl,
        apiKey: getCustomApiKey(profile),
        authHeader: normalizeAuthHeader(profile.authHeader, baseUrl),
        maxCompletionTokens: normalizeMaxCompletionTokens(profile.maxCompletionTokens, baseUrl),
        headers: profile.headers
      }];
    });
  } catch (cause) {
    logger.warn("\u89e3\u6790 MODEL_PROFILES_JSON \u5931\u8d25\uff0c\u5df2\u5ffd\u7565\u81ea\u5b9a\u4e49\u6a21\u578b\u914d\u7f6e\u3002", {
      error: cause instanceof Error ? cause.message : String(cause)
    });
    return [];
  }
}

function buildBuiltinProfiles(): ModelProfile[] {
  return [
    {
      id: "mock",
      label: "\u6f14\u793a\u6a21\u5f0f",
      driver: "mock"
    },
    {
      id: "ollama",
      label: env.ollamaLabel,
      driver: "ollama",
      model: env.ollamaModel,
      baseUrl: normalizeBaseUrl(env.ollamaBaseUrl)
    },
    {
      id: "openai",
      label: env.openAiLabel,
      driver: "openai-compatible",
      model: env.modelName,
      baseUrl: normalizeBaseUrl(env.openAiBaseUrl),
      apiKey: env.openAiApiKey
    },
    {
      id: "anthropic",
      label: env.anthropicLabel,
      driver: "anthropic",
      model: env.anthropicModel,
      baseUrl: normalizeBaseUrl(env.anthropicBaseUrl),
      apiKey: env.anthropicApiKey
    }
  ];
}

function dedupeProfiles(profiles: ModelProfile[]): ModelProfile[] {
  const profileMap = new Map<string, ModelProfile>();

  for (const profile of profiles) {
    profileMap.set(profile.id, profile);
  }

  return Array.from(profileMap.values());
}

function requiresApiKey(profile: ModelProfile): boolean {
  if (profile.driver === "anthropic") {
    return true;
  }

  if (profile.driver !== "openai-compatible") {
    return false;
  }

  return (profile.baseUrl ?? "").includes("api.openai.com");
}

export function isProfileConfigured(profile: ModelProfile): boolean {
  switch (profile.driver) {
    case "mock":
      return true;
    case "ollama":
      return Boolean(profile.baseUrl && profile.model);
    case "openai-compatible":
    case "anthropic":
      return Boolean(profile.baseUrl && profile.model && (!requiresApiKey(profile) || profile.apiKey));
    default:
      return false;
  }
}

export function listModelProfiles(): ModelProfile[] {
  return dedupeProfiles([...buildBuiltinProfiles(), ...parseCustomProfiles()]);
}

export function listPublicModelProfiles(): PublicModelProfile[] {
  return listModelProfiles().map((profile) => ({
    id: profile.id,
    label: profile.label,
    driver: profile.driver,
    model: profile.model,
    baseUrl: profile.baseUrl,
    maxCompletionTokens: profile.maxCompletionTokens,
    configured: isProfileConfigured(profile),
    isDefault: profile.id === env.defaultProviderId
  }));
}

export function applyRequestScopedProviderOverrides(
  profile: ModelProfile,
  overrides?: ProviderEndpointOverrides | null
): ModelProfile {
  if (!overrides) {
    return profile;
  }

  const maxCompletionTokens = normalizeOverrideMaxCompletionTokens(overrides.maxCompletionTokens);
  const profileWithTokenBudget = maxCompletionTokens ? { ...profile, maxCompletionTokens } : profile;

  if (profile.id === "openai") {
    const baseUrl = normalizeBaseUrl(overrides.openaiBaseUrl);
    return baseUrl ? { ...profileWithTokenBudget, baseUrl } : profileWithTokenBudget;
  }

  if (profile.id === "anthropic") {
    const baseUrl = normalizeBaseUrl(overrides.anthropicBaseUrl);
    return baseUrl ? { ...profileWithTokenBudget, baseUrl } : profileWithTokenBudget;
  }

  return profileWithTokenBudget;
}

export function resolveModelProfile(
  providerId?: string | null,
  overrides?: ProviderEndpointOverrides | null
): ModelProfile {
  const profiles = listModelProfiles();

  if (providerId) {
    const selected = profiles.find((profile) => profile.id === providerId);
    if (!selected) {
      throw new Error("\u672a\u627e\u5230\u6240\u9009\u7684\u6a21\u578b\u9a71\u52a8\u3002");
    }

    const effectiveProfile = applyRequestScopedProviderOverrides(selected, overrides);
    if (!isProfileConfigured(effectiveProfile)) {
      throw new Error("\u6240\u9009\u7684\u6a21\u578b\u9a71\u52a8\u5c1a\u672a\u914d\u7f6e\u5b8c\u6210\u3002");
    }

    return effectiveProfile;
  }

  const preferred = profiles.find((profile) => profile.id === env.defaultProviderId);
  if (preferred) {
    const effectiveProfile = applyRequestScopedProviderOverrides(preferred, overrides);
    if (isProfileConfigured(effectiveProfile)) {
      return effectiveProfile;
    }
  }

  const legacyPreferred = profiles.find((profile) => profile.id === env.modelProvider);
  if (legacyPreferred) {
    const effectiveProfile = applyRequestScopedProviderOverrides(legacyPreferred, overrides);
    if (isProfileConfigured(effectiveProfile)) {
      return effectiveProfile;
    }
  }

  const firstConfigured = profiles.find((profile) => isProfileConfigured(applyRequestScopedProviderOverrides(profile, overrides)));
  if (firstConfigured) {
    return applyRequestScopedProviderOverrides(firstConfigured, overrides);
  }

  return profiles[0] ?? { id: "mock", label: "\u6f14\u793a\u6a21\u5f0f", driver: "mock" };
}
