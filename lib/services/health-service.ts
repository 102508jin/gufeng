import { promises as fs } from "node:fs";
import path from "node:path";

import { dataRepository } from "@/lib/infra/db/repositories/data-repository";
import { createEmbeddingProvider, isEmbeddingProfileConfigured, resolveEmbeddingProfile } from "@/lib/infra/embedding/provider-registry";
import { listPublicModelProfiles } from "@/lib/infra/llm/provider-registry";
import { getDefaultVectorIndexPath, readVectorIndex } from "@/lib/infra/vector/vector-index";

type IndexState = {
  personas?: number;
  knowledge?: number;
  vectorDocuments?: number;
  embeddingProvider?: string;
  updatedAt?: string;
};

export type HealthStatus = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: Array<{
    name: string;
    ok: boolean;
    detail?: string;
  }>;
  corpus: {
    personas: number;
    knowledge: number;
  };
  models: {
    configured: number;
    total: number;
    defaultAvailable: boolean;
  };
  embedding: {
    driver: string;
    label: string;
    configured: boolean;
    fingerprint: string;
  };
  index: {
    stateFound: boolean;
    vectorIndexFound: boolean;
    vectorDocuments: number;
    expectedDocuments: number;
    providerMatches: boolean;
    stale: boolean;
    updatedAt?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

async function readIndexState(): Promise<IndexState | null> {
  const filePath = path.join(process.cwd(), "data", "processed", "index-state.json");

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    return {
      personas: readNumber(parsed.personas),
      knowledge: readNumber(parsed.knowledge),
      vectorDocuments: readNumber(parsed.vectorDocuments),
      embeddingProvider: readString(parsed.embeddingProvider),
      updatedAt: readString(parsed.updatedAt)
    };
  } catch {
    return null;
  }
}

export class HealthService {
  async getStatus(): Promise<HealthStatus> {
    const [personas, knowledge, indexState, vectorIndex] = await Promise.all([
      dataRepository.listPersonas(),
      dataRepository.listKnowledge(),
      readIndexState(),
      readVectorIndex(getDefaultVectorIndexPath())
    ]);
    const modelProfiles = listPublicModelProfiles();
    const embeddingProfile = resolveEmbeddingProfile();
    const embeddingProvider = createEmbeddingProvider();
    const configuredModels = modelProfiles.filter((profile) => profile.configured);
    const defaultAvailable = modelProfiles.some((profile) => profile.isDefault && profile.configured);
    const expectedDocuments = knowledge.length;
    const vectorDocuments = vectorIndex?.documents.length ?? 0;
    const providerMatches = Boolean(vectorIndex && vectorIndex.provider.fingerprint === embeddingProvider.fingerprint);
    const vectorIndexFound = Boolean(vectorIndex);
    const stateFound = Boolean(indexState);
    const stale = !vectorIndexFound
      || vectorDocuments !== expectedDocuments
      || !providerMatches
      || indexState?.knowledge !== expectedDocuments
      || indexState?.vectorDocuments !== vectorDocuments;

    const checks = [
      {
        name: "corpus",
        ok: personas.length > 0 && knowledge.length > 0,
        detail: `personas=${personas.length} knowledge=${knowledge.length}`
      },
      {
        name: "modelProfiles",
        ok: configuredModels.length > 0,
        detail: `configured=${configuredModels.length} total=${modelProfiles.length}`
      },
      {
        name: "embeddingProvider",
        ok: isEmbeddingProfileConfigured(embeddingProfile),
        detail: embeddingProvider.fingerprint
      },
      {
        name: "vectorIndex",
        ok: !stale,
        detail: vectorIndexFound ? `vectors=${vectorDocuments} expected=${expectedDocuments}` : "missing"
      }
    ];

    return {
      status: checks.every((check) => check.ok) ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      corpus: {
        personas: personas.length,
        knowledge: knowledge.length
      },
      models: {
        configured: configuredModels.length,
        total: modelProfiles.length,
        defaultAvailable
      },
      embedding: {
        driver: embeddingProfile.driver,
        label: embeddingProfile.label,
        configured: isEmbeddingProfileConfigured(embeddingProfile),
        fingerprint: embeddingProvider.fingerprint
      },
      index: {
        stateFound,
        vectorIndexFound,
        vectorDocuments,
        expectedDocuments,
        providerMatches,
        stale,
        updatedAt: indexState?.updatedAt ?? vectorIndex?.createdAt
      }
    };
  }
}

export const healthService = new HealthService();
