import { NextResponse } from "next/server";
import { z } from "zod";

import { knowledgeService } from "@/lib/services/knowledge-service";
import type { ApiResult } from "@/lib/types/api";
import type { SourceRef } from "@/lib/types/retrieval";

const searchParamsSchema = z.object({
  q: z.string().trim().min(1, "q is required"),
  topK: z.coerce.number().int().min(1).max(10).default(5)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    topK: url.searchParams.get("topK") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "知识库检索参数不合法。",
        issues: parsed.error.issues.map((issue) => issue.message)
      },
      { status: 400 }
    );
  }

  const data = await knowledgeService.search(parsed.data.q, parsed.data.topK);
  const response: ApiResult<SourceRef[]> = { ok: true, data };
  return NextResponse.json(response);
}
