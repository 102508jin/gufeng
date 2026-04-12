import { NextResponse } from "next/server";

import { personaService } from "@/lib/services/persona-service";
import type { ApiResult } from "@/lib/types/api";
import type { PersonaProfile } from "@/lib/types/persona";

export async function GET() {
  const personas = await personaService.listPersonas();
  const response: ApiResult<PersonaProfile[]> = {
    ok: true,
    data: personas
  };

  return NextResponse.json(response);
}