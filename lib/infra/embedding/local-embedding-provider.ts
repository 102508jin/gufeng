import { extractKeywords, normalizeWhitespace } from "@/lib/utils/text";
import type { EmbeddingProvider } from "@/lib/infra/embedding/embedding-provider";

const MIN_TOKEN_LENGTH = 2;

function hashToken(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function tokenize(input: string): string[] {
  const text = normalizeWhitespace(input).toLowerCase();
  const explicitKeywords = extractKeywords(text);
  const asciiTokens = text.match(/[a-z0-9_]{2,}/gu) ?? [];
  const chineseTokens = text.match(/[\u4e00-\u9fff]{2,5}/gu) ?? [];
  const chineseChars = Array.from(text.matchAll(/[\u4e00-\u9fff]/gu), (match) => match[0]);
  const bigrams = chineseChars.slice(0, -1).map((char, index) => `${char}${chineseChars[index + 1]}`);

  return [...new Set([...explicitKeywords, ...asciiTokens, ...chineseTokens, ...bigrams])]
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  return magnitude ? vector.map((value) => value / magnitude) : vector;
}

export class LocalEmbeddingProvider implements EmbeddingProvider {
  kind = "local";

  constructor(private readonly dimensions = 128) {}

  get fingerprint(): string {
    return `local:${Math.max(16, this.dimensions)}`;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const safeDimensions = Math.max(16, this.dimensions);

    return texts.map((text) => {
      const vector = Array.from({ length: safeDimensions }, () => 0);
      const tokens = tokenize(text);

      for (const token of tokens) {
        const hash = hashToken(token);
        const index = hash % safeDimensions;
        const sign = hash & 1 ? -1 : 1;
        vector[index] += sign;
      }

      return normalizeVector(vector);
    });
  }
}
