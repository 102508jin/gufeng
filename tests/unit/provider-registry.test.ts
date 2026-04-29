import { afterEach, describe, expect, it, vi } from "vitest";

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
});
