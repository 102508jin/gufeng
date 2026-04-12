import { promises as fs } from "node:fs";
import path from "node:path";

import { dataRepository } from "../lib/infra/db/repositories/data-repository";

async function main() {
  const filePath = path.join(process.cwd(), "data", "processed", "knowledge.json");
  const data = await dataRepository.listKnowledge();
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote knowledge data: ${data.length} records.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});