import { env } from "@/lib/config/env";
import { logger } from "@/lib/infra/logger";
import type { ModelDriver, ModelProfile, PublicModelProfile } from "@/lib/types/provider";

type RawModelProfile = {
  id?: string;
  label?: string;
  driver?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  apiKeyEnv?: string;
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
  if (profile.apiKey) {
    return profile.apiKey;
  }

  if (profile.apiKeyEnv) {
    return process.env[profile.apiKeyEnv] ?? "";
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

      return [{
        id: profile.id,
        label: profile.label,
        driver,
        model: profile.model,
        baseUrl: profile.baseUrl,
        apiKey: getCustomApiKey(profile),
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
      baseUrl: env.ollamaBaseUrl
    },
    {
      id: "openai",
      label: env.openAiLabel,
      driver: "openai-compatible",
      model: env.modelName,
      baseUrl: env.openAiBaseUrl,
      apiKey: env.openAiApiKey
    },
    {
      id: "anthropic",
      label: env.anthropicLabel,
      driver: "anthropic",
      model: env.anthropicModel,
      baseUrl: env.anthropicBaseUrl,
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
    configured: isProfileConfigured(profile),
    isDefault: profile.id === env.defaultProviderId
  }));
}

export function resolveModelProfile(providerId?: string | null): ModelProfile {
  const profiles = listModelProfiles();

  if (providerId) {
    const selected = profiles.find((profile) => profile.id === providerId);
    if (!selected) {
      throw new Error("\u672a\u627e\u5230\u6240\u9009\u7684\u6a21\u578b\u9a71\u52a8\u3002");
    }

    if (!isProfileConfigured(selected)) {
      throw new Error("\u6240\u9009\u7684\u6a21\u578b\u9a71\u52a8\u5c1a\u672a\u914d\u7f6e\u5b8c\u6210\u3002");
    }

    return selected;
  }

  const preferred = profiles.find((profile) => profile.id === env.defaultProviderId);
  if (preferred && isProfileConfigured(preferred)) {
    return preferred;
  }

  const legacyPreferred = profiles.find((profile) => profile.id === env.modelProvider);
  if (legacyPreferred && isProfileConfigured(legacyPreferred)) {
    return legacyPreferred;
  }

  return profiles.find(isProfileConfigured) ?? profiles[0] ?? { id: "mock", label: "\u6f14\u793a\u6a21\u5f0f", driver: "mock" };
}
