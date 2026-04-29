import { env } from "@/lib/config/env";
import { logger } from "@/lib/infra/logger";
import { LocalEmbeddingProvider } from "@/lib/infra/embedding/local-embedding-provider";
import { OpenAiCompatibleEmbeddingProvider } from "@/lib/infra/embedding/openai-compatible-embedding-provider";
import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";
import type { EmbeddingDriver, EmbeddingProfile } from "@/lib/types/provider";

function normalizeEmbeddingDriver(driver: string | undefined): EmbeddingDriver {
  switch (driver) {
    case "openai":
    case "openai-compatible":
      return "openai-compatible";
    case "local":
    default:
      return "local";
  }
}

export function resolveEmbeddingProfile(): EmbeddingProfile {
  const driver = normalizeEmbeddingDriver(env.embeddingProvider);

  if (driver === "openai-compatible") {
    return {
      id: "openai-compatible",
      label: env.embeddingLabel,
      driver,
      model: env.embeddingModel,
      baseUrl: env.embeddingBaseUrl,
      apiKey: env.embeddingApiKey
    };
  }

  return {
    id: "local",
    label: env.embeddingLabel,
    driver: "local",
    dimensions: env.embeddingDimensions
  };
}

export function isEmbeddingProfileConfigured(profile: EmbeddingProfile): boolean {
  if (profile.driver === "local") {
    return Boolean(profile.dimensions);
  }

  const requiresApiKey = (profile.baseUrl ?? "").includes("api.openai.com");
  return Boolean(profile.baseUrl && profile.model && (!requiresApiKey || profile.apiKey));
}

export function createEmbeddingProvider(): EmbeddingProvider {
  const profile = resolveEmbeddingProfile();

  if (profile.driver === "openai-compatible") {
    if (isEmbeddingProfileConfigured(profile)) {
      return new OpenAiCompatibleEmbeddingProvider(profile);
    }

    logger.warn("Embedding provider 未配置完整，已回退到本地 Hashing Embedding。", {
      provider: profile.driver
    });
  }

  return new LocalEmbeddingProvider(profile.dimensions);
}
