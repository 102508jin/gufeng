export type ModelDriver = "mock" | "ollama" | "openai-compatible" | "anthropic";

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
