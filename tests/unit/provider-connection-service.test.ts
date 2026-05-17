import { afterEach, describe, expect, it, vi } from "vitest";

import {
  testModelProfileConnection,
  type ProviderConnectionTestResult
} from "@/lib/services/provider-connection-service";
import type { ModelProfile } from "@/lib/types/provider";

describe("provider connection service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports mock provider as connected without issuing network requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await testModelProfileConnection({
      id: "mock",
      label: "演示模式",
      driver: "mock"
    });

    expect(result.ok).toBe(true);
    expect(result.detail).toContain("无需外部连接");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("checks the OpenAI-compatible metadata endpoint with safe result details", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const profile: ModelProfile = {
      id: "custom",
      label: "Custom",
      driver: "openai-compatible",
      model: "custom-model",
      baseUrl: "https://example.test/v1/",
      apiKey: "secret-key",
      maxCompletionTokens: 8192
    };

    const result: ProviderConnectionTestResult = await testModelProfileConnection(profile);
    const call = fetchMock.mock.calls[0] as [string, RequestInit] | undefined;

    expect(result.ok).toBe(true);
    expect(result.maxCompletionTokens).toBe(8192);
    expect(call).toBeDefined();
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe("https://example.test/v1/models");
    expect(init).toMatchObject({ method: "GET" });
    expect(JSON.stringify(result)).not.toContain("secret-key");
  });
});
