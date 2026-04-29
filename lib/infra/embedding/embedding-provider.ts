import type { SearchableDocument } from "@/lib/infra/vector/vector-store";

export interface EmbeddingProvider {
  kind: string;
  fingerprint: string;
  embedTexts(texts: string[]): Promise<number[][]>;
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  if (!length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function formatDocumentForEmbedding(document: SearchableDocument): string {
  return [
    document.title,
    document.author,
    document.summary,
    document.content,
    document.keywords.join(" ")
  ].filter(Boolean).join("\n");
}
