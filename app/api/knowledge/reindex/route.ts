import { NextResponse } from "next/server";

import { knowledgeService } from "@/lib/services/knowledge-service";

export async function POST() {
  const result = await knowledgeService.reindex();
  return NextResponse.json({ ok: true, data: result });
}