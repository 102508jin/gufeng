import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      status: "\u6b63\u5e38",
      timestamp: new Date().toISOString()
    }
  });
}
