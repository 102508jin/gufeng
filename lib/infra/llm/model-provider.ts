import type { ZodType } from "zod";

import { env } from "@/lib/config/env";
import { logger } from "@/lib/infra/logger";
import { MockModelProvider } from "@/lib/infra/llm/mock-provider";
import { OllamaProvider } from "@/lib/infra/llm/ollama-provider";
import { OpenAiProvider } from "@/lib/infra/llm/openai-provider";

export type ModelOptions = {
  temperature?: number;
  systemPrompt?: string;
};

export interface ModelProvider {
  kind: string;
  generateText(prompt: string, options?: ModelOptions): Promise<string>;
  generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T>;
}

export function createModelProvider(): ModelProvider {
  switch (env.modelProvider) {
    case "openai": {
      if (!env.openAiApiKey) {
        logger.warn("OPENAI_API_KEY is missing, falling back to mock provider.");
        return new MockModelProvider();
      }
      return new OpenAiProvider();
    }
    case "ollama":
      return new OllamaProvider();
    default:
      return new MockModelProvider();
  }
}