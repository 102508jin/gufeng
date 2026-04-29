import { describe, expect, it } from "vitest";

import {
  buildKnowledgeRecords,
  normalizeKnowledgeRecord,
  normalizeRawKnowledgeDocument
} from "@/lib/domain/knowledge-ingestion";

describe("knowledge ingestion", () => {
  it("normalizes raw documents and emits traceable chunks", () => {
    const document = normalizeRawKnowledgeDocument({
      id: "raw-study",
      title: "学习语料",
      author: "测试语料",
      category: "education",
      source: "unit-test-corpus",
      license: "internal-test",
      era: "modern",
      content: "学习贵在立志，也贵在持恒。每日定一小功，久之自能积小成大，不为一时迟速所乱。若遇倦怠，则减其量而不断其日课，使心知可行，事有凭据。",
      summary: "用于学习和坚持主题。",
      keywords: ["学习", "坚持"],
      credibility: "high",
      updatedAt: "2026-04-29"
    });

    const records = buildKnowledgeRecords([document], { chunkSize: 40, overlap: 0 });

    expect(records.length).toBeGreaterThan(1);
    expect(records[0]).toMatchObject({
      documentId: "raw-study",
      chunkId: "raw-study-chunk-1",
      chunkIndex: 0,
      source: "unit-test-corpus",
      license: "internal-test",
      credibility: "high",
      updatedAt: "2026-04-29"
    });
  });

  it("rejects raw documents without required metadata", () => {
    expect(() => normalizeRawKnowledgeDocument({
      id: "bad-doc",
      title: "缺许可语料",
      category: "education",
      source: "unit-test-corpus",
      content: "缺少 license。",
      credibility: "medium",
      updatedAt: "2026-04-29"
    })).toThrow(/license/);
  });

  it("normalizes legacy processed records with default metadata", () => {
    const record = normalizeKnowledgeRecord({
      id: "legacy-1",
      title: "旧知识",
      author: "旧语料",
      category: "life",
      content: "处世宜慎言行。",
      keywords: ["处世"],
      credibility: "medium"
    });

    expect(record).toMatchObject({
      id: "legacy-1",
      documentId: "legacy-1",
      chunkId: "legacy-1",
      source: "旧语料",
      license: "internal-sample",
      updatedAt: "2026-04-29"
    });
  });
});
