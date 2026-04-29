import { describe, expect, it } from "vitest";

import { KnowledgeService } from "@/lib/services/knowledge-service";

describe("knowledge service", () => {
  it("returns ranked source refs for a query", async () => {
    const service = new KnowledgeService();
    const refs = await service.search("\u62d6\u5ef6 \u81ea\u5f8b", 3);

    expect(refs.length).toBeGreaterThan(0);
    expect(refs.length).toBeLessThanOrEqual(3);
    expect(refs[0].sourceType).toBe("knowledge");
    expect(refs[0].excerpt.length).toBeGreaterThan(0);
    expect(refs[0].chunkId).toBeTruthy();
    expect(refs[0].source).toBe("project-sample-corpus");
    expect(refs[0].license).toBe("internal-sample");
  });
});
