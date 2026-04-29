import { z } from "zod";

import { createModelRequestSignal } from "@/lib/infra/llm/request-timeout";
import type { EmbeddingProfile } from "@/lib/types/provider";
import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().optional(),
      embedding: z.array(z.number())
    })
  )
});

function joinUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/+$/u, "")}/${pathname.replace(/^\/+/u, "")}`;
}

export class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
  kind = "openai-compatible";

  constructor(private readonly profile: EmbeddingProfile) {}

  get fingerprint(): string {
    const baseUrl = this.profile.baseUrl?.replace(/\/+$/u, "") ?? "";
    return `openai-compatible:${baseUrl}:${this.profile.model ?? ""}`;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (this.profile.apiKey) {
      headers.Authorization = `Bearer ${this.profile.apiKey}`;
    }

    const response = await fetch(joinUrl(this.profile.baseUrl ?? "", "/embeddings"), {
      method: "POST",
      headers,
      signal: createModelRequestSignal(),
      body: JSON.stringify({
        model: this.profile.model,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding 请求失败，状态码 ${response.status}`);
    }

    const payload = embeddingResponseSchema.parse(await response.json());
    return payload.data
      .slice()
      .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((item) => item.embedding);
  }
}
