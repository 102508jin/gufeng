import { NextResponse } from "next/server";

import { healthService } from "@/lib/services/health-service";
import type { ApiResult } from "@/lib/types/api";
import type { HealthStatus } from "@/lib/services/health-service";

export async function GET() {
  const data = await healthService.getStatus();
  const response: ApiResult<HealthStatus> = { ok: true, data };
  return NextResponse.json(response, { status: data.status === "ok" ? 200 : 503 });
}
