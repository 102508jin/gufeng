import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/lib/infra/logger";
import { generateRequestSchema } from "@/lib/schemas/generate";
import { generateService } from "@/lib/services/generate-service";
import type { ApiResult } from "@/lib/types/api";
import type { GenerateResponse } from "@/lib/types/generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = generateRequestSchema.parse(body);
    const data = await generateService.generate(payload);
    const response: ApiResult<GenerateResponse> = { ok: true, data };
    return NextResponse.json(response);
  } catch (cause) {
    if (cause instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "\u8bf7\u6c42\u53c2\u6570\u4e0d\u5408\u6cd5\u3002",
          issues: cause.issues.map((issue) => issue.message)
        },
        { status: 400 }
      );
    }

    logger.error("Generation request failed.", {
      error: cause instanceof Error ? cause.message : String(cause)
    });

    return NextResponse.json(
      {
        ok: false,
        error: "\u751f\u6210\u65f6\u53d1\u751f\u9519\u8bef\uff0c\u8bf7\u68c0\u67e5\u672c\u5730\u6a21\u578b\u914d\u7f6e\u6216\u7a0d\u540e\u91cd\u8bd5\u3002"
      },
      { status: 500 }
    );
  }
}
