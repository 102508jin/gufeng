import { z, type ZodType } from "zod";

import { env } from "@/lib/config/env";
import type { ModelOptions, ModelProvider } from "@/lib/infra/llm/model-provider";

const ollamaResponseSchema = z.object({
  response: z.string()
});

function extractJsonBlock(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/u);
  const withoutFence = fencedMatch?.[1]?.trim() ?? input.trim();
  const withoutThinkTag = withoutFence.replace(/<think>[\s\S]*?<\/think>/gu, "").trim();

  const objectStart = withoutThinkTag.indexOf("{");
  const arrayStart = withoutThinkTag.indexOf("[");
  const startCandidates = [objectStart, arrayStart].filter((value) => value >= 0);

  if (!startCandidates.length) {
    return withoutThinkTag;
  }

  const start = Math.min(...startCandidates);
  const objectEnd = withoutThinkTag.lastIndexOf("}");
  const arrayEnd = withoutThinkTag.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);

  if (end < start) {
    return withoutThinkTag.slice(start).trim();
  }

  return withoutThinkTag.slice(start, end + 1).trim();
}

async function requestOllama(prompt: string, options?: ModelOptions, format?: "json") {
  const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.ollamaModel,
      system: options?.systemPrompt,
      prompt,
      stream: false,
      think: false,
      format,
      options: {
        temperature: options?.temperature ?? 0.6
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama \u8bf7\u6c42\u5931\u8d25\uff0c\u72b6\u6001\u7801 ${response.status}`);
  }

  return ollamaResponseSchema.parse(await response.json()).response;
}

function unwrapStructuredCandidate(input: unknown): unknown {
  if (Array.isArray(input) || input === null || typeof input !== "object") {
    return input;
  }

  const values = Object.values(input);
  const arrayValue = values.find(Array.isArray);
  if (arrayValue) {
    return arrayValue;
  }

  if (values.length === 1 && values[0] && typeof values[0] === "object") {
    return values[0];
  }

  return input;
}

export class OllamaProvider implements ModelProvider {
  kind = "ollama";

  async generateText(prompt: string, options?: ModelOptions): Promise<string> {
    return requestOllama(prompt, options);
  }

  async generateStructured<T>(prompt: string, schema: ZodType<T>, options?: ModelOptions): Promise<T> {
    const responseText = await requestOllama(
      `${prompt}\n\nReturn JSON only. Do not add markdown fences or extra commentary.`,
      {
        ...options,
        temperature: options?.temperature ?? 0.2
      },
      "json"
    );
    const jsonText = extractJsonBlock(responseText);
    const parsed = JSON.parse(jsonText);

    try {
      return schema.parse(parsed);
    } catch {
      return schema.parse(unwrapStructuredCandidate(parsed));
    }
  }
}
