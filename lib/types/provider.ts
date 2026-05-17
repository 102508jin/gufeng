export type ModelDriver = "mock" | "ollama" | "openai-compatible" | "anthropic";
export type EmbeddingDriver = "local" | "openai-compatible";

export type ProviderEndpointOverrides = {
  openaiBaseUrl?: string;
  anthropicBaseUrl?: string;
  maxCompletionTokens?: number;
};

export type ModelProfile = {
  id: string;
  label: string;
  driver: ModelDriver;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  authHeader?: "authorization" | "api-key";
  maxCompletionTokens?: number;
  headers?: Record<string, string>;
};

export type PublicModelProfile = {
  id: string;
  label: string;
  driver: ModelDriver;
  model?: string;
  baseUrl?: string;
  maxCompletionTokens?: number;
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
