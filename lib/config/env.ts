import { DEFAULT_EXPLANATION_MODES, DEFAULT_MODEL_REQUEST_TIMEOUT_MS, DEFAULT_VARIANTS_COUNT } from "@/lib/config/constants";

const rawExplanationModes = process.env.DEFAULT_EXPLANATION_MODES?.split(",").map((value) => value.trim()).filter(Boolean);
const openAiBaseUrl = process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1";
const openAiApiKey = process.env.OPENAI_API_KEY ?? "";

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  modelProvider: process.env.MODEL_PROVIDER ?? "mock",
  defaultProviderId: process.env.DEFAULT_PROVIDER_ID ?? process.env.MODEL_PROVIDER ?? "mock",
  modelProfilesJson: process.env.MODEL_PROFILES_JSON ?? "",
  modelName: process.env.MODEL_NAME ?? "gpt-4.1-mini",
  openAiBaseUrl,
  openAiApiKey,
  openAiLabel: process.env.OPENAI_PROVIDER_LABEL ?? "OpenAI \u517c\u5bb9\u63a5\u53e3",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  ollamaLabel: process.env.OLLAMA_PROVIDER_LABEL ?? "\u672c\u5730 Ollama",
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
  anthropicLabel: process.env.ANTHROPIC_PROVIDER_LABEL ?? "Claude / Anthropic",
  defaultVariantsCount: Number(process.env.DEFAULT_VARIANTS_COUNT ?? DEFAULT_VARIANTS_COUNT),
  defaultExplanationModes: rawExplanationModes?.length ? rawExplanationModes : DEFAULT_EXPLANATION_MODES,
  modelRequestTimeoutMs: numberFromEnv(process.env.MODEL_REQUEST_TIMEOUT_MS, DEFAULT_MODEL_REQUEST_TIMEOUT_MS),
  embeddingProvider: process.env.EMBEDDING_PROVIDER ?? "local",
  embeddingLabel: process.env.EMBEDDING_PROVIDER_LABEL ?? "\u672c\u5730 Hashing Embedding",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingBaseUrl: process.env.EMBEDDING_API_BASE_URL ?? openAiBaseUrl,
  embeddingApiKey: process.env.EMBEDDING_API_KEY ?? openAiApiKey,
  embeddingDimensions: numberFromEnv(process.env.EMBEDDING_DIMENSIONS, 128)
};
