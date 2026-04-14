import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

    return NextResponse.json(
      {
        ok: false,
        error: cause instanceof Error ? cause.message : "\u751f\u6210\u65f6\u53d1\u751f\u672a\u77e5\u9519\u8bef\u3002"
      },
      { status: 500 }
    );
  }
}
