import { z, type ZodType } from "zod";

import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";
import type { ModelProfile } from "@/lib/types/provider";

const openAiResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable()
      })
    })
  )
});

function extractJsonBlock(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/u);
  return fencedMatch?.[1]?.trim() ?? input.trim();
}

export class OpenAiProvider implements ModelProvider {
  kind = "openai-compatible";

  constructor(private readonly profile: ModelProfile) {}

  async generateText(prompt: string, options?: ModelOptions): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.profile.headers
    };

    if (this.profile.apiKey) {
      headers.Authorization = `Bearer ${this.profile.apiKey}`;
    }

    const response = await fetch(`${this.profile.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.profile.model,
        temperature: options?.temperature ?? 0.6,
        messages: [
          options?.systemPrompt ? { role: "system", content: options.systemPrompt } : null,
          { role: "user", content: prompt }
        ].filter(Boolean)
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI \u8bf7\u6c42\u5931\u8d25\uff0c\u72b6\u6001\u7801 ${response.status}`);
    }

    const payload = openAiResponseSchema.parse(await response.json());
    return payload.choices[0]?.message.content ?? "";
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
