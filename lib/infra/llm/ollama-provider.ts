import { z, type ZodType } from "zod";

import { env } from "@/lib/config/env";
import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";

const ollamaResponseSchema = z.object({
  response: z.string()
});

function extractJsonBlock(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/u);
  return fencedMatch?.[1]?.trim() ?? input.trim();
}

export class OllamaProvider implements ModelProvider {
  kind = "ollama";

  async generateText(prompt: string, options?: ModelOptions): Promise<string> {
    const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt: `${options?.systemPrompt ? `${options.systemPrompt}\n\n` : ""}${prompt}`,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.6
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const payload = ollamaResponseSchema.parse(await response.json());
    return payload.response;
  }

  async generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T> {
    const responseText = await this.generateText(`${prompt}\n\n请仅输出 JSON。`, options);
    const jsonText = extractJsonBlock(responseText);
    return schema.parse(JSON.parse(jsonText));
  }
}