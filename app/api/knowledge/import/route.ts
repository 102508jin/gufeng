import { NextResponse } from "next/server";
import { z } from "zod";

import { knowledgeImportService } from "@/lib/services/knowledge-import-service";
import type { ApiResult } from "@/lib/types/api";

const importDocumentSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().trim().min(1).max(120),
  author: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  source: z.string().trim().max(120).optional(),
  license: z.string().trim().max(80).optional(),
  era: z.string().trim().max(80).optional(),
  content: z.string().trim().min(8).max(20_000),
  summary: z.string().trim().max(500).optional(),
  keywords: z.array(z.string().trim().min(1).max(24)).max(16).optional(),
  credibility: z.enum(["low", "medium", "high"]).optional(),
  updatedAt: z.string().trim().max(40).optional()
});

const importRequestSchema = z.object({
  documents: z.array(importDocumentSchema).min(1).max(20)
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "知识库导入请求体不是合法 JSON。"
      },
      { status: 400 }
    );
  }

  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "知识库导入参数不合法。",
        issues: parsed.error.issues.map((issue) => issue.message)
      },
      { status: 400 }
    );
  }

  try {
    const data = await knowledgeImportService.importDocuments(parsed.data.documents);
    const response: ApiResult<typeof data> = { ok: true, data };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "知识库导入失败。"
      },
      { status: 500 }
    );
  }
}
