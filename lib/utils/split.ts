export function splitIntoChunks(input: string, chunkSize = 120, overlap = 20): string[] {
  const text = input.trim();
  if (!text) {
    return [];
  }

  const safeChunkSize = Math.max(chunkSize, 40);
  const safeOverlap = Math.min(Math.max(overlap, 0), safeChunkSize / 2);
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const next = text.slice(cursor, cursor + safeChunkSize);
    chunks.push(next.trim());
    cursor += safeChunkSize - safeOverlap;
  }

  return chunks.filter(Boolean);
}