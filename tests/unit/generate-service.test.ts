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
});