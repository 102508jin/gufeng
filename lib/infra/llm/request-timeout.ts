import { env } from "@/lib/config/env";

export function createModelRequestSignal(): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(env.modelRequestTimeoutMs);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.modelRequestTimeoutMs);

  if (typeof timeout === "object" && "unref" in timeout && typeof timeout.unref === "function") {
    timeout.unref();
  }

  return controller.signal;
}
