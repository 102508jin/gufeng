import { z, type ZodType } from "zod";

import { env } from "@/lib/config/env";
import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";

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
  kind = "openai";

  async generateText(prompt: string, options?: ModelOptions): Promise<string> {
    const response = await fetch(`${env.openAiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: env.modelName,
        temperature: options?.temperature ?? 0.6,
        messages: [
          options?.systemPrompt ? { role: "system", content: options.systemPrompt } : null,
          { role: "user", content: prompt }
        ].filter(Boolean)
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = openAiResponseSchema.parse(await response.json());
    return payload.choices[0]?.message.content ?? "";
  }

  async generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T> {
    const responseText = await this.generateText(`${prompt}\n\n请仅输出 JSON，不要输出额外说明。`, options);
    const jsonText = extractJsonBlock(responseText);
    return schema.parse(JSON.parse(jsonText));
  }
}