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
          error: "Invalid request payload.",
          issues: cause.issues.map((issue) => issue.message)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: cause instanceof Error ? cause.message : "Unknown generation error."
      },
      { status: 500 }
    );
  }
}