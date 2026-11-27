import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 64 * 1024;

/**
 * Echo stub — validates JSON Content-Type and rejects oversized bodies.
 * Not a production API; no auth, no persistence.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "content-type must be application/json" },
      { status: 415 },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload too large" },
      { status: 413 },
    );
  }

  let body: unknown = null;
  if (raw.length > 0) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid json" },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    echo: body,
    ts: new Date().toISOString(),
  });
}
