import { promises as fs } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { KnowledgeImportService } from "@/lib/services/knowledge-import-service";

const tempRoot = path.join(process.cwd(), "tests", ".tmp-knowledge-import");

async function seedRawCorpus() {
  const rawDir = path.join(tempRoot, "raw");
  await fs.mkdir(rawDir, { recursive: true });
  await fs.writeFile(path.join(rawDir, "seed.json"), JSON.stringify([{
    id: "seed-doc",
    title: "基础语料",
    category: "seed",
    source: "unit-test",
    license: "internal-test",
    content: "基础语料用于测试导入流程。",
    keywords: ["测试"],
    credibility: "medium",
    updatedAt: "2026-04-30"
  }], null, 2), "utf8");
}

describe("knowledge import service", () => {
  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it("appends user imports and rebuilds processed corpus plus vector index", async () => {
    await seedRawCorpus();
    const service = new KnowledgeImportService({
      rawDir: path.join(tempRoot, "raw"),
      importsPath: path.join(tempRoot, "raw", "user-imports.json"),
      processedPath: path.join(tempRoot, "processed", "knowledge.json"),
      vectorIndexPath: path.join(tempRoot, "processed", "vector-index.json"),
      indexStatePath: path.join(tempRoot, "processed", "index-state.json")
    });

    const result = await service.importDocuments([{
      title: "用户导入语料",
      category: "user",
      content: "这是一段用户导入的知识库内容，用来说明拖延、自律与执行。",
      keywords: ["拖延", "自律"],
      credibility: "high"
    }]);
    const processed = JSON.parse(await fs.readFile(path.join(tempRoot, "processed", "knowledge.json"), "utf8")) as unknown[];
    const imports = JSON.parse(await fs.readFile(path.join(tempRoot, "raw", "user-imports.json"), "utf8")) as unknown[];
    const vectorIndex = JSON.parse(await fs.readFile(path.join(tempRoot, "processed", "vector-index.json"), "utf8")) as { documents: unknown[] };

    expect(result.imported).toBe(1);
    expect(result.totalRawDocuments).toBe(2);
    expect(processed).toHaveLength(2);
    expect(imports).toHaveLength(1);
    expect(vectorIndex.documents).toHaveLength(2);
  });

  it("rejects imports without enough content", async () => {
    await seedRawCorpus();
    const service = new KnowledgeImportService({
      rawDir: path.join(tempRoot, "raw"),
      importsPath: path.join(tempRoot, "raw", "user-imports.json"),
      processedPath: path.join(tempRoot, "processed", "knowledge.json"),
      vectorIndexPath: path.join(tempRoot, "processed", "vector-index.json"),
      indexStatePath: path.join(tempRoot, "processed", "index-state.json")
    });

    await expect(service.importDocuments([{
      title: "坏数据",
      content: "太短"
    }])).rejects.toThrow(/内容过短/);
  });
});
