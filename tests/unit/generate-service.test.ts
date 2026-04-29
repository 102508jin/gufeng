import { describe, expect, it } from "vitest";

import { MockModelProvider } from "@/lib/infra/llm/mock-provider";
import type { ModelProvider } from "@/lib/infra/llm/model-provider";
import { GenerateService } from "@/lib/services/generate-service";
import type { ModelProfile } from "@/lib/types/provider";

describe("generate service", () => {
  it("returns variants and explanations in mock mode", async () => {
    const service = new GenerateService();
    const result = await service.generate({
      query: "\u6700\u8fd1\u505a\u4e8b\u603b\u62d6\u5ef6\uff0c\u600e\u6837\u624d\u80fd\u575a\u6301\u8ba1\u5212\uff1f",
      inputMode: "auto",
      personaId: "zhuge-liang",
      variantsCount: 3,
      explanationModes: ["literal", "free", "gloss"]
    });

    expect(result.variants.length).toBeGreaterThan(0);
    expect(result.normalizedQuery).toContain("\u62d6\u5ef6");
    expect(result.retrievalRefs.length).toBeGreaterThan(0);
    expect(result.retrievalRefs.some((ref) => ref.metadata.license === "internal-sample")).toBe(true);
    expect(result.variants[0].sources.some((source) => source.license === "internal-sample")).toBe(true);
  });

  it("applies user context and can disable knowledge retrieval", async () => {
    const service = new GenerateService();
    const result = await service.generate({
      query: "\u600e\u6837\u628a\u5b66\u4e60\u8ba1\u5212\u843d\u5230\u6bcf\u5929\uff1f",
      inputMode: "auto",
      variantsCount: 2,
      explanationModes: ["literal"],
      aiIntervention: "conservative",
      retrievalMode: "off",
      userContext: {
        displayName: "\u6d4b\u8bd5\u7528\u6237",
        useCase: "\u5b66\u4e60\u8ba1\u5212",
        preference: "\u7b80\u6d01"
      }
    });

    expect(result.variants).toHaveLength(2);
    expect(result.retrievalRefs).toHaveLength(0);
    expect(result.debug?.aiIntervention).toBe("conservative");
    expect(result.debug?.retrievalMode).toBe("off");
    expect(result.debug?.userContextApplied).toBe(true);
  });

  it("falls back to mock provider when a primary provider fails", async () => {
    const failingProvider: ModelProvider = {
      kind: "openai-compatible",
      async generateText() {
        throw new Error("primary unavailable");
      },
      async generateStructured() {
        throw new Error("primary unavailable");
      }
    };
    const failingProfile: ModelProfile = {
      id: "failing-provider",
      label: "Failing Provider",
      driver: "openai-compatible",
      model: "test",
      baseUrl: "http://127.0.0.1:9999/v1"
    };
    const service = new GenerateService(
      () => failingProfile,
      (profile) => profile.driver === "mock" ? new MockModelProvider() : failingProvider
    );

    const result = await service.generate({
      query: "如何减少拖延？",
      inputMode: "auto",
      variantsCount: 2,
      explanationModes: ["literal"],
      retrievalMode: "focused"
    });

    expect(result.variants).toHaveLength(2);
    expect(result.debug?.providerId).toBe("mock");
    expect(result.debug?.primaryProviderId).toBe("failing-provider");
    expect(result.debug?.fallbackProviderId).toBe("mock");
    expect(result.debug?.fallbackReason).toContain("primary unavailable");
  });
});
