export type ModelDriver = "mock" | "ollama" | "openai-compatible" | "anthropic";
export type EmbeddingDriver = "local" | "openai-compatible";

export type ModelProfile = {
  id: string;
  label: string;
  driver: ModelDriver;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
};

export type PublicModelProfile = {
  id: string;
  label: string;
  driver: ModelDriver;
  model?: string;
  configured: boolean;
  isDefault: boolean;
};

export type EmbeddingProfile = {
  id: string;
  label: string;
  driver: EmbeddingDriver;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  dimensions?: number;
};
