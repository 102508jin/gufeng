import { describe, expect, it } from "vitest";

import { GenerateService } from "@/lib/services/generate-service";

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
});
