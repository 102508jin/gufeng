import { NextResponse } from "next/server";

import { listPublicModelProfiles } from "@/lib/infra/llm/provider-registry";
import type { ApiResult } from "@/lib/types/api";
import type { PublicModelProfile } from "@/lib/types/provider";

export async function GET() {
  const response: ApiResult<PublicModelProfile[]> = {
    ok: true,
    data: listPublicModelProfiles()
  };

  return NextResponse.json(response);
}
