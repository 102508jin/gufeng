import { createModelRequestSignal } from "@/lib/infra/llm/request-timeout";
import {
  isProfileConfigured,
  resolveModelProfile
} from "@/lib/infra/llm/provider-registry";
import type { ModelProfile, ProviderEndpointOverrides } from "@/lib/types/provider";

export type ProviderConnectionTestInput = {
  providerId?: string | null;
  providerOverrides?: ProviderEndpointOverrides | null;
};

export type ProviderConnectionTestResult = {
  ok: boolean;
  configured: boolean;
  providerId: string;
  provider: string;
  driver: ModelProfile["driver"];
  baseUrl?: string;
  maxCompletionTokens?: number;
  detail: string;
};

function buildEndpointUrl(profile: ModelProfile, route: string): string {
  return `${profile.baseUrl?.replace(/\/+$/u, "")}/${route.replace(/^\/+/u, "")}`;
}

function buildHeaders(profile: ModelProfile): Record<string, string> {
  const headers: Record<string, string> = {
    ...profile.headers
  };

  if (profile.driver === "anthropic") {
    headers["anthropic-version"] = "2023-06-01";
    if (profile.apiKey) {
      headers["x-api-key"] = profile.apiKey;
    }
    return headers;
  }

  if (profile.driver === "openai-compatible" && profile.apiKey) {
    if (profile.authHeader === "api-key") {
      headers["api-key"] = profile.apiKey;
    } else {
      headers.Authorization = `Bearer ${profile.apiKey}`;
    }
  }

  return headers;
}

function httpFailureDetail(response: Response): string {
  if (response.status === 401 || response.status === 403) {
    return `认证失败，服务返回 HTTP ${response.status}。请检查 API key 或鉴权方式。`;
  }

  if (response.status === 404 || response.status === 405) {
    return `服务已响应，但元数据接口返回 HTTP ${response.status}。请确认 API 基础 URL 是否包含正确版本路径。`;
  }

  return `连接失败，服务返回 HTTP ${response.status}。`;
}

async function checkHttpEndpoint(profile: ModelProfile, route: string): Promise<Pick<ProviderConnectionTestResult, "ok" | "detail">> {
  const response = await fetch(buildEndpointUrl(profile, route), {
    method: "GET",
    headers: buildHeaders(profile),
    signal: createModelRequestSignal()
  });

  if (response.ok) {
    return { ok: true, detail: "连接正常，服务元数据接口可访问。" };
  }

  return { ok: false, detail: httpFailureDetail(response) };
}

export async function testModelProfileConnection(profile: ModelProfile): Promise<ProviderConnectionTestResult> {
  const configured = isProfileConfigured(profile);
  const base = {
    configured,
    providerId: profile.id,
    provider: profile.label,
    driver: profile.driver,
    baseUrl: profile.baseUrl,
    maxCompletionTokens: profile.maxCompletionTokens
  };

  if (!configured) {
    return {
      ...base,
      ok: false,
      detail: "当前模型配置不完整，无法测试连接。"
    };
  }

  if (profile.driver === "mock") {
    return {
      ...base,
      ok: true,
      detail: "演示模式无需外部连接。"
    };
  }

  try {
    const route = profile.driver === "ollama" ? "api/tags" : "models";
    const result = await checkHttpEndpoint(profile, route);
    return {
      ...base,
      ...result
    };
  } catch (cause) {
    return {
      ...base,
      ok: false,
      detail: cause instanceof Error ? `连接失败：${cause.message}` : "连接失败。"
    };
  }
}

export async function testProviderConnection(input: ProviderConnectionTestInput): Promise<ProviderConnectionTestResult> {
  try {
    const profile = resolveModelProfile(input.providerId, input.providerOverrides);
    return await testModelProfileConnection(profile);
  } catch (cause) {
    return {
      ok: false,
      configured: false,
      providerId: input.providerId ?? "",
      provider: input.providerId ?? "默认模型",
      driver: "mock",
      detail: cause instanceof Error ? cause.message : "当前模型配置不可用。"
    };
  }
}
