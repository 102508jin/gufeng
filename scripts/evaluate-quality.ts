import { promises as fs } from "node:fs";
import path from "node:path";

import { GenerateService } from "../lib/services/generate-service";
import type { GenerateResponse } from "../lib/types/generation";

type EvaluationCase = {
  id: string;
  query: string;
  personaId?: string | null;
  expectedTopics: string[];
};

type CaseResult = {
  id: string;
  passed: boolean;
  score: number;
  checks: Array<{
    name: string;
    passed: boolean;
    detail?: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function parseEvaluationCases(input: unknown): EvaluationCase[] {
  if (!Array.isArray(input)) {
    throw new Error("Evaluation cases must be an array.");
  }

  return input.map((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.query !== "string") {
      throw new Error(`Invalid evaluation case at index ${index}.`);
    }

    return {
      id: item.id,
      query: item.query,
      personaId: typeof item.personaId === "string" || item.personaId === null ? item.personaId : undefined,
      expectedTopics: readStringArray(item.expectedTopics)
    };
  });
}

async function readEvaluationCases(): Promise<EvaluationCase[]> {
  const filePath = path.join(process.cwd(), "data", "evals", "generation-cases.json");
  return parseEvaluationCases(JSON.parse(await fs.readFile(filePath, "utf8")));
}

function containsAsciiLetters(input: string): boolean {
  return /[a-z]/iu.test(input);
}

function evaluateCase(testCase: EvaluationCase, result: GenerateResponse): CaseResult {
  const sourceIds = new Set(result.retrievalRefs.map((source) => source.id));
  const allVariantSources = result.variants.flatMap((variant) => variant.sources);
  const searchableText = [
    result.normalizedQuery,
    ...(result.debug?.normalizationNotes ?? []),
    ...result.retrievalRefs.map((source) => `${source.title} ${source.summary ?? source.content}`)
  ].join(" ");

  const checks = [
    {
      name: "variant-count",
      passed: result.variants.length >= 2,
      detail: `variants=${result.variants.length}`
    },
    {
      name: "classical-output",
      passed: result.variants.every((variant) => variant.classicalText.length >= 12 && !containsAsciiLetters(variant.classicalText))
    },
    {
      name: "explanations",
      passed: result.variants.every((variant) => Boolean(
        variant.literalExplanation
        && variant.freeExplanation
        && variant.glossExplanation
        && variant.lineByLinePairs.length
      ))
    },
    {
      name: "source-traceability",
      passed: allVariantSources.length > 0 && allVariantSources.every((source) => sourceIds.has(source.id)),
      detail: `variantSources=${allVariantSources.length} retrieved=${sourceIds.size}`
    },
    {
      name: "topic-coverage",
      passed: testCase.expectedTopics.some((topic) => searchableText.includes(topic)),
      detail: `expected=${testCase.expectedTopics.join(",")}`
    }
  ];
  const passedCount = checks.filter((check) => check.passed).length;

  return {
    id: testCase.id,
    passed: checks.every((check) => check.passed),
    score: passedCount / checks.length,
    checks
  };
}

async function main() {
  const cases = await readEvaluationCases();
  const service = new GenerateService();
  const results: CaseResult[] = [];

  for (const testCase of cases) {
    const result = await service.generate({
      query: testCase.query,
      inputMode: "auto",
      personaId: testCase.personaId,
      providerId: "mock",
      variantsCount: 3,
      explanationModes: ["literal", "free", "gloss"],
      aiIntervention: "balanced",
      retrievalMode: "auto"
    });

    results.push(evaluateCase(testCase, result));
  }

  const passed = results.filter((result) => result.passed).length;
  const averageScore = results.reduce((total, result) => total + result.score, 0) / results.length;
  const report = {
    ok: passed === results.length,
    cases: results.length,
    passed,
    averageScore: Number(averageScore.toFixed(3)),
    results
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
