import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_COMPLETION_TOKEN_BUDGET,
  MIN_COMPLETION_TOKEN_BUDGET
} from "@/lib/config/constants";
import { testProviderConnection } from "@/lib/services/provider-connection-service";
import type { ApiResult } from "@/lib/types/api";

const providerTestRequestSchema = z.object({
  providerId: z.string().trim().min(1).nullable().optional(),
  providerOverrides: z.object({
    openaiBaseUrl: z.string().trim().url().optional(),
    anthropicBaseUrl: z.string().trim().url().optional(),
    maxCompletionTokens: z.coerce.number().int()
      .min(MIN_COMPLETION_TOKEN_BUDGET)
      .max(MAX_COMPLETION_TOKEN_BUDGET)
      .optional()
  }).optional()
});

export async function POST(request: Request) {
  const parsed = providerTestRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    const response: ApiResult<never> = {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid provider test request"
    };
    return NextResponse.json(response, { status: 400 });
  }

  const data = await testProviderConnection(parsed.data);
  const response: ApiResult<typeof data> = { ok: true, data };
  return NextResponse.json(response, { status: 200 });
}
