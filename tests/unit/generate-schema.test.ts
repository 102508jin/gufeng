import { describe, expect, it } from "vitest";

import { MAX_QUERY_LENGTH } from "@/lib/config/constants";
import { generateRequestSchema } from "@/lib/schemas/generate";

describe("generate request schema", () => {
  it("rejects overly long queries before model calls", () => {
    const parsed = generateRequestSchema.safeParse({
      query: "x".repeat(MAX_QUERY_LENGTH + 1)
    });

    expect(parsed.success).toBe(false);
  });
});
