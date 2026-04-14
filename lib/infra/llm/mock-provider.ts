import type { ZodType } from "zod";

import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";

export class MockModelProvider implements ModelProvider {
  kind = "mock";

  async generateText(prompt: string, _options?: ModelOptions): Promise<string> {
    return `\u6f14\u793a\u6a21\u578b\u5df2\u6536\u5230\u63d0\u793a\u8bcd\uff1a${prompt.slice(0, 120)}`;
  }

  async generateStructured<T>(_prompt: string, schema: ZodType<T>, _options?: ModelOptions): Promise<T> {
    return schema.parse({});
  }
}
