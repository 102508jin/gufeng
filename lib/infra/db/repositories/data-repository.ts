import { promises as fs } from "node:fs";
import path from "node:path";

import { normalizeKnowledgeRecord } from "@/lib/domain/knowledge-ingestion";
import type { PersonaRecord } from "@/lib/types/persona";
import type { KnowledgeRecord } from "@/lib/types/retrieval";

const personas: PersonaRecord[] = [
  {
    id: "kongzi",
    name: "\u5b54\u5b50",
    dynasty: "\u6625\u79cb",
    description: "\u91cd\u793c\u3001\u91cd\u4ec1\u3001\u91cd\u6559\u5316\uff0c\u8a00\u8f9e\u5e73\u6b63\u800c\u542b\u89c4\u52b1\u3002",
    styleSummary: "\u597d\u4ee5\u5bf9\u4e3e\u660e\u7406\uff0c\u8bed\u6c14\u6e29\u539a\u800c\u6709\u8282\u5236\uff0c\u5e38\u7531\u4fee\u8eab\u800c\u63a8\u53ca\u9f50\u5bb6\u5904\u4e16\u3002",
    sourceCount: 3,
    sources: [
      {
        id: "kongzi-1",
        title: "\u300a\u8bba\u8bed\u00b7\u5b66\u800c\u300b",
        author: "\u300a\u8bba\u8bed\u300b",
        content: "\u5b66\u800c\u65f6\u4e60\u4e4b\uff0c\u4e0d\u4ea6\u8bf4\u4e4e\u3002\u4eba\u4e0d\u77e5\u800c\u4e0d\u6120\uff0c\u4e0d\u4ea6\u541b\u5b50\u4e4e\u3002",
        summary: "\u5f3a\u8c03\u5b66\u4e60\u3001\u4fee\u8eab\u4e0e\u541b\u5b50\u4e4b\u5fc3\u3002",
        keywords: ["\u5b66\u4e60", "\u4fee\u8eab", "\u541b\u5b50", "\u4ea4\u53cb"],
        credibility: "high"
      },
      {
        id: "kongzi-2",
        title: "\u300a\u8bba\u8bed\u00b7\u4e3a\u653f\u300b",
        author: "\u300a\u8bba\u8bed\u300b",
        content: "\u4e3a\u653f\u4ee5\u5fb7\uff0c\u8b6c\u5982\u5317\u8fb0\uff0c\u5c45\u5176\u6240\u800c\u4f17\u661f\u5171\u4e4b\u3002",
        summary: "\u4ee5\u5fb7\u7acb\u8eab\u7acb\u4e8b\u3002",
        keywords: ["\u5fb7\u884c", "\u4e3a\u653f", "\u4fee\u5df1"],
        credibility: "high"
      },
      {
        id: "kongzi-3",
        title: "\u300a\u8bba\u8bed\u00b7\u536b\u7075\u516c\u300b",
        author: "\u300a\u8bba\u8bed\u300b",
        content: "\u5de5\u6b32\u5584\u5176\u4e8b\uff0c\u5fc5\u5148\u5229\u5176\u5668\u3002",
        summary: "\u5f3a\u8c03\u505a\u4e8b\u5f53\u5148\u5907\u5176\u5177\u3002",
        keywords: ["\u65b9\u6cd5", "\u51c6\u5907", "\u5b66\u4e60", "\u505a\u4e8b"],
        credibility: "high"
      }
    ]
  },
  {
    id: "zhuge-liang",
    name: "\u8bf8\u845b\u4eae",
    dynasty: "\u4e09\u56fd",
    description: "\u91cd\u7b79\u5212\u3001\u91cd\u8d23\u4efb\u3001\u91cd\u6267\u884c\uff0c\u8bed\u8a00\u5ba1\u614e\u800c\u6761\u7406\u5206\u660e\u3002",
    styleSummary: "\u5584\u5206\u6761\u9648\u8bf4\uff0c\u91cd\u5148\u540e\u7f13\u6025\uff0c\u5e38\u4ee5\u5fe0\u8bda\u3001\u8fdc\u8c0b\u3001\u52e4\u8c28\u4e3a\u8bba\u8bc1\u4e3b\u8f74\u3002",
    sourceCount: 3,
    sources: [
      {
        id: "zgl-1",
        title: "\u300a\u8beb\u5b50\u4e66\u300b",
        author: "\u8bf8\u845b\u4eae",
        content: "\u9759\u4ee5\u4fee\u8eab\uff0c\u4fed\u4ee5\u517b\u5fb7\u3002\u975e\u6de1\u6cca\u65e0\u4ee5\u660e\u5fd7\uff0c\u975e\u5b81\u9759\u65e0\u4ee5\u81f4\u8fdc\u3002",
        summary: "\u5f3a\u8c03\u9759\u3001\u4fed\u3001\u5fd7\u3001\u8fdc\u4e4b\u5173\u7cfb\u3002",
        keywords: ["\u4fee\u8eab", "\u5fd7\u5411", "\u5b81\u9759", "\u52e4\u5b66"],
        credibility: "high"
      },
      {
        id: "zgl-2",
        title: "\u300a\u51fa\u5e08\u8868\u300b",
        author: "\u8bf8\u845b\u4eae",
        content: "\u53d7\u4efb\u4e8e\u8d25\u519b\u4e4b\u9645\uff0c\u5949\u547d\u4e8e\u5371\u96be\u4e4b\u95f4\u3002",
        summary: "\u4f53\u73b0\u62c5\u5f53\u4e0e\u5ba1\u614e\u7684\u653f\u6cbb\u8868\u8fbe\u3002",
        keywords: ["\u8d23\u4efb", "\u5fe0\u8bda", "\u62c5\u5f53", "\u8c0b\u5212"],
        credibility: "high"
      },
      {
        id: "zgl-3",
        title: "\u300a\u5c06\u82d1\u300b",
        author: "\u8bf8\u845b\u4eae",
        content: "\u6cbb\u519b\u4e4b\u9053\uff0c\u52a1\u5728\u4e25\u6574\uff0c\u8d4f\u7f5a\u5fc5\u4fe1\uff0c\u8fdb\u9000\u6709\u5ea6\u3002",
        summary: "\u5f3a\u8c03\u5236\u5ea6\u4e0e\u6267\u884c\u7684\u5e76\u91cd\u3002",
        keywords: ["\u6267\u884c", "\u5236\u5ea6", "\u7b79\u5212", "\u7eaa\u5f8b"],
        credibility: "medium"
      }
    ]
  },
  {
    id: "tao-yuanming",
    name: "\u9676\u6e0a\u660e",
    dynasty: "\u4e1c\u664b",
    description: "\u5d07\u81ea\u7136\u3001\u5c1a\u771f\u7387\uff0c\u8bed\u6c14\u6de1\u8fdc\uff0c\u5c11\u96d5\u9970\u800c\u591a\u4f59\u5473\u3002",
    styleSummary: "\u559c\u7528\u5e73\u6de1\u8bed\u5199\u6df1\u610f\uff0c\u8282\u594f\u8212\u7f13\uff0c\u5e38\u4ee5\u5f52\u771f\u3001\u5b88\u62d9\u3001\u81ea\u9002\u4e4b\u610f\u5165\u6587\u3002",
    sourceCount: 3,
    sources: [
      {
        id: "tym-1",
        title: "\u300a\u5f52\u56ed\u7530\u5c45\u300b",
        author: "\u9676\u6e0a\u660e",
        content: "\u4e45\u5728\u6a0a\u7b3c\u91cc\uff0c\u590d\u5f97\u8fd4\u81ea\u7136\u3002",
        summary: "\u5f3a\u8c03\u8fd4\u672c\u5f52\u771f\u4e0e\u81ea\u6211\u5b89\u987f\u3002",
        keywords: ["\u81ea\u7136", "\u5f52\u771f", "\u81ea\u7531", "\u5b88\u62d9"],
        credibility: "high"
      },
      {
        id: "tym-2",
        title: "\u300a\u996e\u9152\u300b",
        author: "\u9676\u6e0a\u660e",
        content: "\u91c7\u83ca\u4e1c\u7bf1\u4e0b\uff0c\u60a0\u7136\u89c1\u5357\u5c71\u3002",
        summary: "\u4ee5\u6de1\u8fdc\u666f\u8c61\u5448\u73b0\u4ece\u5bb9\u4e4b\u5883\u3002",
        keywords: ["\u4ece\u5bb9", "\u5c71\u6c34", "\u81ea\u7136", "\u5b81\u9759"],
        credibility: "high"
      },
      {
        id: "tym-3",
        title: "\u300a\u4e94\u67f3\u5148\u751f\u4f20\u300b",
        author: "\u9676\u6e0a\u660e",
        content: "\u4e0d\u621a\u621a\u4e8e\u8d2b\u8d31\uff0c\u4e0d\u6c72\u6c72\u4e8e\u5bcc\u8d35\u3002",
        summary: "\u8868\u8fbe\u5bf9\u4e16\u4fd7\u529f\u5229\u7684\u8d85\u8131\u6001\u5ea6\u3002",
        keywords: ["\u8d85\u8131", "\u8d2b\u5bcc", "\u81ea\u5b88", "\u4eba\u751f"],
        credibility: "high"
      }
    ]
  }
];

const knowledgeSeed: unknown[] = [
  {
    id: "knowledge-1",
    title: "\u529d\u5b66\u8868\u8fbe\u8303\u5f0f",
    author: "\u793a\u4f8b\u8bed\u6599",
    category: "education",
    content: "\u529d\u5b66\u7c7b\u6587\u8a00\u7b54\u590d\u5b9c\u91cd\u5fd7\u3001\u91cd\u6052\u3001\u91cd\u6cd5\u3002\u53ef\u7528\u7acb\u5fd7\u3001\u5faa\u5e8f\u3001\u79ef\u7d2f\u7b49\u9aa8\u67b6\u3002",
    summary: "\u9002\u7528\u4e8e\u5b66\u4e60\u3001\u8bfb\u4e66\u3001\u8003\u8bd5\u3001\u6210\u957f\u4e3b\u9898\u3002",
    keywords: ["\u5b66\u4e60", "\u8bfb\u4e66", "\u8003\u8bd5", "\u6210\u957f", "\u529d\u5b66"],
    credibility: "medium"
  },
  {
    id: "knowledge-2",
    title: "\u5904\u4e16\u529d\u8beb\u8868\u8fbe",
    author: "\u793a\u4f8b\u8bed\u6599",
    category: "life",
    content: "\u5904\u4e16\u7c7b\u56de\u7b54\u5b9c\u5e73\u8861\u5b88\u672c\u5fc3\u3001\u614e\u8a00\u884c\u3001\u62e9\u53cb\u3001\u77e5\u8fdb\u9000\u3002",
    summary: "\u9002\u7528\u4e8e\u4eba\u751f\u3001\u4ea4\u53cb\u3001\u5904\u4e16\u4e0e\u60c5\u7eea\u8bae\u9898\u3002",
    keywords: ["\u4eba\u751f", "\u5904\u4e16", "\u670b\u53cb", "\u60c5\u7eea", "\u9009\u62e9"],
    credibility: "medium"
  },
  {
    id: "knowledge-3",
    title: "\u89e3\u6790\u5199\u6cd5\u8bf4\u660e",
    author: "\u793a\u4f8b\u8bed\u6599",
    category: "analysis",
    content: "\u9010\u53e5\u89e3\u6790\u5e94\u7d27\u8d34\u539f\u53e5\uff0c\u610f\u8bd1\u89e3\u6790\u53ef\u8865\u8db3\u903b\u8f91\u5173\u7cfb\uff0c\u5173\u952e\u8bcd\u6ce8\u91ca\u4f18\u5148\u89e3\u91ca\u865a\u8bcd\u4e0e\u62bd\u8c61\u6982\u5ff5\u3002",
    summary: "\u89c4\u8303\u9010\u53e5\u89e3\u6790\u3001\u610f\u8bd1\u89e3\u6790\u548c\u6ce8\u91ca\u7684\u5dee\u522b\u3002",
    keywords: ["\u89e3\u6790", "\u610f\u8bd1", "\u6ce8\u91ca", "\u9010\u53e5", "\u6587\u8a00"],
    credibility: "high"
  },
  {
    id: "knowledge-4",
    title: "\u81ea\u5f8b\u4e0e\u60dc\u65f6\u8868\u8fbe",
    author: "\u793a\u4f8b\u8bed\u6599",
    category: "discipline",
    content: "\u8bba\u81ea\u5f8b\u4e0e\u65f6\u95f4\uff0c\u53ef\u7528\u60dc\u9634\u3001\u65e9\u4f5c\u3001\u6301\u6052\u3001\u65e5\u7701\u7b49\u8868\u8fbe\u3002",
    summary: "\u9002\u7528\u4e8e\u62d6\u5ef6\u3001\u81ea\u5f8b\u3001\u6548\u7387\u4e0e\u89c4\u5212\u3002",
    keywords: ["\u65f6\u95f4", "\u81ea\u5f8b", "\u62d6\u5ef6", "\u89c4\u5212", "\u575a\u6301"],
    credibility: "medium"
  },
  {
    id: "knowledge-5",
    title: "\u95ee\u9898\u5f52\u4e00\u5316\u8bf4\u660e",
    author: "\u793a\u4f8b\u8bed\u6599",
    category: "normalization",
    content: "\u5bf9\u73b0\u4ee3\u53e3\u8bed\u8f93\u5165\uff0c\u5e94\u5148\u62bd\u51fa\u6838\u5fc3\u95ee\u9898\uff0c\u518d\u8f6c\u4e3a\u4e66\u9762\u73b0\u4ee3\u6c49\u8bed\uff0c\u6700\u540e\u8fdb\u884c\u6587\u8a00\u5316\u3002",
    summary: "\u8bf4\u660e\u4e3a\u4f55\u9700\u8981\u5148\u505a\u73b0\u4ee3\u6c49\u8bed\u4e2d\u95f4\u7a3f\u3002",
    keywords: ["\u5f52\u4e00\u5316", "\u767d\u8bdd", "\u4e2d\u95f4\u7a3f", "\u6587\u8a00\u8f6c\u5199"],
    credibility: "high"
  }
];

async function readProcessedKnowledge(): Promise<KnowledgeRecord[] | null> {
  const filePath = path.join(process.cwd(), "data", "processed", "knowledge.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const normalized = parsed
      .map(normalizeKnowledgeRecord)
      .filter((item): item is KnowledgeRecord => Boolean(item));

    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

export class DataRepository {
  async listPersonas(): Promise<PersonaRecord[]> {
    return personas;
  }

  async getPersona(personaId: string): Promise<PersonaRecord | null> {
    return personas.find((persona) => persona.id === personaId) ?? null;
  }

  async listKnowledge(): Promise<KnowledgeRecord[]> {
    const processed = await readProcessedKnowledge();
    if (processed) {
      return processed;
    }

    return knowledgeSeed
      .map(normalizeKnowledgeRecord)
      .filter((item): item is KnowledgeRecord => Boolean(item));
  }
}

export const dataRepository = new DataRepository();
