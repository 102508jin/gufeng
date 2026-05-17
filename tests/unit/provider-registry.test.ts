import { afterEach, describe, expect, it, vi } from "vitest";

import type { ModelProfile } from "@/lib/types/provider";

describe("provider registry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("ignores inline custom api keys", async () => {
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("MODEL_PROFILES_JSON", JSON.stringify([
      {
        id: "custom",
        label: "Custom",
        driver: "openai-compatible",
        baseUrl: "https://example.test/v1",
        model: "example-model",
        apiKey: "inline-secret"
      }
    ]));

    const { listModelProfiles } = await import("@/lib/infra/llm/provider-registry");
    const customProfile = listModelProfiles().find((profile) => profile.id === "custom");

    expect(customProfile?.apiKey).toBe("");
  });

  it("allows custom api keys through apiKeyEnv", async () => {
    vi.resetModules();
    vi.stubEnv("CUSTOM_MODEL_API_KEY", "env-secret");
    vi.stubEnv("MODEL_PROFILES_JSON", JSON.stringify([
      {
        id: "custom",
        label: "Custom",
        driver: "openai-compatible",
        baseUrl: "https://example.test/v1",
        model: "example-model",
        apiKeyEnv: "CUSTOM_MODEL_API_KEY"
      }
    ]));

    const { listModelProfiles } = await import("@/lib/infra/llm/provider-registry");
    const customProfile = listModelProfiles().find((profile) => profile.id === "custom");

    expect(customProfile?.apiKey).toBe("env-secret");
  });

  it("applies request-scoped baseUrl overrides to built-in openai and anthropic providers", async () => {
    const { applyRequestScopedProviderOverrides } = await import("@/lib/infra/llm/provider-registry");
    const openaiProfile: ModelProfile = {
      id: "openai",
      label: "OpenAI Compatible",
      driver: "openai-compatible",
      model: "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "test-key"
    };
    const anthropicProfile: ModelProfile = {
      id: "anthropic",
      label: "Claude / Anthropic",
      driver: "anthropic",
      model: "claude-3-5-sonnet-latest",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: "test-key"
    };

    expect(applyRequestScopedProviderOverrides(openaiProfile, {
      openaiBaseUrl: "https://proxy.example.com/v1/"
    }).baseUrl).toBe("https://proxy.example.com/v1");

    expect(applyRequestScopedProviderOverrides(anthropicProfile, {
      anthropicBaseUrl: "http://127.0.0.1:8080/v1/"
    }).baseUrl).toBe("http://127.0.0.1:8080/v1");
  });

  it("applies request-scoped max completion token overrides to the selected profile", async () => {
    const { applyRequestScopedProviderOverrides } = await import("@/lib/infra/llm/provider-registry");
    const profile: ModelProfile = {
      id: "openai",
      label: "OpenAI Compatible",
      driver: "openai-compatible",
      model: "gpt-4.1-mini",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "test-key",
      maxCompletionTokens: 1024
    };

    expect(applyRequestScopedProviderOverrides(profile, {
      maxCompletionTokens: 8192
    }).maxCompletionTokens).toBe(8192);
  });

  it("leaves unrelated providers unchanged when request-scoped overrides are present", async () => {
    const { applyRequestScopedProviderOverrides } = await import("@/lib/infra/llm/provider-registry");
    const mockProfile: ModelProfile = {
      id: "mock",
      label: "\u6f14\u793a\u6a21\u5f0f",
      driver: "mock"
    };

    expect(applyRequestScopedProviderOverrides(mockProfile, {
      openaiBaseUrl: "https://proxy.example.com/v1"
    })).toEqual(mockProfile);
  });
});
