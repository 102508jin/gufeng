import { promises as fs } from "node:fs";
import path from "node:path";

import {
  buildKnowledgeRecords,
  normalizeRawKnowledgeDocument,
  type RawKnowledgeDocument
} from "../lib/domain/knowledge-ingestion";

async function readRawKnowledgeDocuments(rawDir: string): Promise<RawKnowledgeDocument[]> {
  const entries = await fs.readdir(rawDir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (!jsonFiles.length) {
    throw new Error(`No raw knowledge JSON files found in ${rawDir}.`);
  }

  const documents: RawKnowledgeDocument[] = [];
  for (const fileName of jsonFiles) {
    const filePath = path.join(rawDir, fileName);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      try {
        documents.push(normalizeRawKnowledgeDocument(item));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${fileName}: ${message}`);
      }
    }
  }

  return documents;
}

async function main() {
  const rawDir = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(process.cwd(), "data", "raw", "knowledge");
  const outputPath = path.join(process.cwd(), "data", "processed", "knowledge.json");
  const documents = await readRawKnowledgeDocuments(rawDir);
  const records = buildKnowledgeRecords(documents);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  console.log(`Wrote knowledge data: documents=${documents.length} chunks=${records.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
