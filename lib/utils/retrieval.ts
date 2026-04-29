import type { RetrievedChunk, SourceMetadata, SourceRef } from "@/lib/types/retrieval";
import { toExcerpt } from "@/lib/utils/text";

function readString(metadata: SourceMetadata, key: keyof SourceMetadata): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function toSourceRef(chunk: RetrievedChunk): SourceRef {
  return {
    id: chunk.id,
    sourceType: chunk.sourceType,
    title: chunk.title,
    author: chunk.author,
    excerpt: toExcerpt(chunk.summary ?? chunk.content),
    score: chunk.score,
    source: readString(chunk.metadata, "source"),
    license: readString(chunk.metadata, "license"),
    era: readString(chunk.metadata, "era"),
    credibility: readString(chunk.metadata, "credibility") as SourceRef["credibility"],
    updatedAt: readString(chunk.metadata, "updatedAt"),
    chunkId: readString(chunk.metadata, "chunkId"),
    documentId: readString(chunk.metadata, "documentId")
  };
}
