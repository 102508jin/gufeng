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
        logger.warn("\u672a\u68c0\u6d4b\u5230 OPENAI_API_KEY\uff0c\u5df2\u56de\u9000\u5230\u6f14\u793a\u6a21\u578b\u3002");
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
