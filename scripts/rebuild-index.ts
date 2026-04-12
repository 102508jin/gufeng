import { knowledgeService } from "../lib/services/knowledge-service";

async function main() {
  const result = await knowledgeService.reindex();
  console.log(`Reindexed local sources. personas=${result.personas} knowledge=${result.knowledge}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});