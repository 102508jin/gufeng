import type { ZodType } from "zod";

import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";

export class MockModelProvider implements ModelProvider {
  kind = "mock";

  async generateText(prompt: string, _options?: ModelOptions): Promise<string> {
    return `Mock provider received prompt: ${prompt.slice(0, 120)}`;
  }

  async generateStructured<T>(_prompt: string, schema: ZodType<T>, _options?: ModelOptions): Promise<T> {
    return schema.parse({});
  }
}