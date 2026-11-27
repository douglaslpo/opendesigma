import { NextResponse } from "next/server";
import { MAX_BODY_BYTES, readLimitedBody } from "@/lib/read-limited-body.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Echo stub — requires application/json and rejects bodies over MAX_BODY_BYTES.
 *
 * The cap is 65536 octets, applied while the body is read (byteLength), not
 * JavaScript string length. Exactly 65536 bytes of valid JSON is accepted.
 * One more byte returns 413 and the unread tail is cancelled.
 *
 * A zero-byte body with application/json is not invalid JSON: the response is
 * 200 and `echo` is null. A JSON literal `null` is a separate 4-byte payload
 * that also echoes null. Whitespace-only text is invalid JSON (400).
 *
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

  const limited = await readLimitedBody(request, MAX_BODY_BYTES);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: limited.error },
      { status: 413 },
    );
  }

  if (limited.bytes.byteLength === 0) {
    return NextResponse.json({
      ok: true,
      echo: null,
      ts: new Date().toISOString(),
    });
  }

  const raw = new TextDecoder("utf-8", { fatal: false }).decode(limited.bytes);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid json" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    echo: body,
    ts: new Date().toISOString(),
  });
}
