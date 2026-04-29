import { z, type ZodType } from "zod";

import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";
import { createModelRequestSignal } from "@/lib/infra/llm/request-timeout";
import type { ModelProfile } from "@/lib/types/provider";

const anthropicResponseSchema = z.object({
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string().optional()
    })
  )
});

function extractJsonBlock(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/u);
  return fencedMatch?.[1]?.trim() ?? input.trim();
}

export class AnthropicProvider implements ModelProvider {
  kind = "anthropic";

  constructor(private readonly profile: ModelProfile) {}

  async generateText(prompt: string, options?: ModelOptions): Promise<string> {
    const response = await fetch(`${this.profile.baseUrl}/messages`, {
      method: "POST",
      signal: createModelRequestSignal(),
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": this.profile.apiKey ?? "",
        ...this.profile.headers
      },
      body: JSON.stringify({
        model: this.profile.model,
        system: options?.systemPrompt,
        temperature: options?.temperature ?? 0.6,
        max_tokens: 1200,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic \u8bf7\u6c42\u5931\u8d25\uff0c\u72b6\u6001\u7801 ${response.status}`);
    }

    const payload = anthropicResponseSchema.parse(await response.json());
    return payload.content
      .filter((item) => item.type === "text")
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  async generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T> {
    const responseText = await this.generateText(
      `${prompt}\n\n\u8bf7\u4ec5\u8f93\u51fa JSON\uff0c\u4e0d\u8981\u8f93\u51fa\u989d\u5916\u8bf4\u660e\u3002`,
      options
    );
    const jsonText = extractJsonBlock(responseText);
    return schema.parse(JSON.parse(jsonText));
  }
}
