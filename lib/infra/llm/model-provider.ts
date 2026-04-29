import type { ZodType } from "zod";

import { AnthropicProvider } from "@/lib/infra/llm/anthropic-provider";
import { MockModelProvider } from "@/lib/infra/llm/mock-provider";
import { OllamaProvider } from "@/lib/infra/llm/ollama-provider";
import { OpenAiProvider } from "@/lib/infra/llm/openai-provider";
import type { ModelProfile } from "@/lib/types/provider";

export type ModelOptions = {
  temperature?: number;
  systemPrompt?: string;
};

export interface ModelProvider {
  kind: string;
  generateText(prompt: string, options?: ModelOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T>;
}

export function createModelProvider(profile: ModelProfile): ModelProvider {
  switch (profile.driver) {
    case "openai-compatible":
      return new OpenAiProvider(profile);
    case "anthropic":
      return new AnthropicProvider(profile);
    case "ollama":
      return new OllamaProvider(profile);
    case "mock":
    default:
      return new MockModelProvider();
  }
}
