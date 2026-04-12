import { describe, expect, it } from "vitest";

import { detectInputMode, draftModernAnswer, extractKeywords } from "@/lib/utils/text";

describe("text utilities", () => {
  it("detects classical input from common markers", () => {
    expect(detectInputMode("\u543e\u6b32\u95ee\u5b66\u4e4b\u9053\uff0c\u5f53\u82e5\u4f55\u884c\u4e4b\u4e4e\uff1f")).toBe("classical");
  });

  it("extracts keywords from modern input", () => {
    expect(extractKeywords("\u6211\u6700\u8fd1\u5728\u51c6\u5907\u8003\u8bd5\uff0c\u603b\u662f\u62d6\u5ef6\u590d\u4e60")).toContain("\u8003\u8bd5");
  });

  it("drafts learning advice for study-themed input", () => {
    const lines = draftModernAnswer("\u5982\u4f55\u63d0\u9ad8\u5b66\u4e60\u6548\u7387", ["\u5b66\u4e60", "\u6548\u7387"]);
    expect(lines[0]).toContain("\u5b66\u4e60");
    expect(lines).toHaveLength(3);
  });
});