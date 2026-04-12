import { DEFAULT_EXPLANATION_MODES, DEFAULT_VARIANTS_COUNT } from "@/lib/config/constants";

const rawExplanationModes = process.env.DEFAULT_EXPLANATION_MODES?.split(",").map((value) => value.trim()).filter(Boolean);

export const env = {
  modelProvider: process.env.MODEL_PROVIDER ?? "mock",
  modelName: process.env.MODEL_NAME ?? "gpt-4.1-mini",
  openAiBaseUrl: process.env.OPENAI_API_BASE_URL ?? "https://api.openai.com/v1",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen2.5:7b",
  defaultVariantsCount: Number(process.env.DEFAULT_VARIANTS_COUNT ?? DEFAULT_VARIANTS_COUNT),
  defaultExplanationModes: rawExplanationModes?.length ? rawExplanationModes : DEFAULT_EXPLANATION_MODES
};