import { describe, expect, it } from "vitest";

import { HealthService } from "@/lib/services/health-service";

describe("health service", () => {
  it("reports deployment readiness without exposing secrets", async () => {
    const service = new HealthService();
    const status = await service.getStatus();
    const serialized = JSON.stringify(status);

    expect(status.status).toBe("ok");
    expect(status.corpus.personas).toBeGreaterThan(0);
    expect(status.corpus.knowledge).toBeGreaterThan(0);
    expect(status.index.vectorIndexFound).toBe(true);
    expect(status.index.stale).toBe(false);
    expect(status.models.configured).toBeGreaterThan(0);
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("OPENAI_API_KEY");
  });
});
