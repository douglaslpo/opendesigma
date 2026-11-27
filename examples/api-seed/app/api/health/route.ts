import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness stub for the optional OpenDesigma backend path. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "opendesigma-api-seed",
    ts: new Date().toISOString(),
  });
}
