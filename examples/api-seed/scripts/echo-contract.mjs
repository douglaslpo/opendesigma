/**
 * Runtime contract for the api-seed echo/health handlers.
 * Start the server first, then:
 *   API_BASE=http://127.0.0.1:3456 node scripts/echo-contract.mjs
 */
import assert from "node:assert/strict";
import http from "node:http";
import { MAX_BODY_BYTES } from "../lib/read-limited-body.mjs";

const base = (process.env.API_BASE ?? "http://127.0.0.1:3456").replace(/\/$/, "");
const baseUrl = new URL(base);

function jsonStringBytes(totalBytes, filler) {
  const unit = Buffer.from(filler);
  const inner = totalBytes - 2;
  if (inner < 0 || inner % unit.length !== 0) {
    throw new Error(
      `cannot fill ${totalBytes} bytes with ${JSON.stringify(filler)} (${unit.length} octets)`,
    );
  }
  const count = inner / unit.length;
  const out = Buffer.alloc(totalBytes);
  out[0] = 0x22;
  for (let i = 0; i < count; i += 1) unit.copy(out, 1 + i * unit.length);
  out[totalBytes - 1] = 0x22;
  return out;
}

/** One € (3 octets) plus é (2 octets), wrapped in JSON quotes. */
function jsonStringMultibyteOver(totalBytes) {
  const euro = Buffer.from("€");
  const acute = Buffer.from("é");
  const inner = totalBytes - 2 - euro.length;
  if (inner < 0 || inner % acute.length !== 0) {
    throw new Error(`cannot mix-fill ${totalBytes} bytes`);
  }
  const count = inner / acute.length;
  const out = Buffer.alloc(totalBytes);
  out[0] = 0x22;
  euro.copy(out, 1);
  for (let i = 0; i < count; i += 1) {
    acute.copy(out, 1 + euro.length + i * acute.length);
  }
  out[totalBytes - 1] = 0x22;
  return out;
}

async function post(body, headers = {}) {
  const response = await fetch(`${base}/api/echo`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

function postChunked(chunks) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        protocol: baseUrl.protocol,
        hostname: baseUrl.hostname,
        port: baseUrl.port,
        path: "/api/echo",
        method: "POST",
        headers: { "content-type": "application/json" },
      },
      (res) => {
        const parts = [];
        res.on("data", (chunk) => parts.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(parts).toString("utf8");
          let json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode, json, text });
        });
      },
    );
    req.on("error", reject);
    for (const chunk of chunks) req.write(chunk);
    req.end();
  });
}

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? null });
    console.log(`ok  ${name}${detail ? `  ${detail}` : ""}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, error: message });
    console.error(`FAIL ${name}  ${message}`);
  }
}

await check("GET /api/health", async () => {
  const response = await fetch(`${base}/api/health`);
  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.service, "opendesigma-api-seed");
  assert.match(json.ts, /^\d{4}-\d{2}-\d{2}T/);
  return json.service;
});

await check("POST valid object", async () => {
  const { status, json } = await post(JSON.stringify({ ping: true }));
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.deepEqual(json.echo, { ping: true });
  assert.match(json.ts, /^\d{4}-\d{2}-\d{2}T/);
});

await check("POST invalid JSON", async () => {
  const { status, json } = await post("{");
  assert.equal(status, 400);
  assert.equal(json.ok, false);
  assert.equal(json.error, "invalid json");
});

await check("POST wrong content-type", async () => {
  const { status, json } = await post(JSON.stringify({ ping: true }), {
    "content-type": "text/plain",
  });
  assert.equal(status, 415);
  assert.equal(json.ok, false);
  assert.match(json.error, /application\/json/);
});

await check("POST missing content-type", async () => {
  const response = await fetch(`${base}/api/echo`, {
    method: "POST",
    body: JSON.stringify({ ping: true }),
  });
  const json = await response.json();
  assert.equal(response.status, 415);
  assert.equal(json.ok, false);
});

await check("POST application/json charset", async () => {
  const { status, json } = await post(JSON.stringify({ n: 1 }), {
    "content-type": "application/json; charset=utf-8",
  });
  assert.equal(status, 200);
  assert.deepEqual(json.echo, { n: 1 });
});

await check("POST empty body", async () => {
  const { status, json } = await post(new Uint8Array(0));
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.echo, null);
  return "echo null, 0 bytes";
});

await check("POST JSON null is not the empty body", async () => {
  const { status, json } = await post("null");
  assert.equal(status, 200);
  assert.equal(json.echo, null);
  assert.equal(Buffer.byteLength("null"), 4);
});

await check("POST ASCII exactly 65536 bytes", async () => {
  const body = jsonStringBytes(MAX_BODY_BYTES, "a");
  assert.equal(body.length, MAX_BODY_BYTES);
  const { status, json } = await post(body);
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(Buffer.from(JSON.stringify(json.echo), "utf8").equals(body), true);
});

await check("POST ASCII 65537 bytes", async () => {
  const body = Buffer.concat([
    jsonStringBytes(MAX_BODY_BYTES, "a"),
    Buffer.from("x"),
  ]);
  assert.equal(body.length, MAX_BODY_BYTES + 1);
  const { status, json } = await post(body);
  assert.equal(status, 413);
  assert.equal(json.ok, false);
  assert.equal(json.error, "payload too large");
});

await check("POST multibyte exactly 65536 bytes", async () => {
  const body = jsonStringBytes(MAX_BODY_BYTES, "é");
  const asText = body.toString("utf8");
  assert.equal(body.length, MAX_BODY_BYTES);
  assert.ok(asText.length < MAX_BODY_BYTES);
  const { status, json } = await post(body);
  assert.equal(status, 200);
  assert.equal(Buffer.from(JSON.stringify(json.echo), "utf8").equals(body), true);
  return `utf8 ${body.length} octets, string length ${asText.length}`;
});

await check("POST multibyte 65537 bytes under string cap", async () => {
  const body = jsonStringMultibyteOver(MAX_BODY_BYTES + 1);
  const asText = body.toString("utf8");
  assert.equal(body.length, MAX_BODY_BYTES + 1);
  assert.ok(asText.length < MAX_BODY_BYTES);
  const { status, json } = await post(body);
  assert.equal(status, 413);
  assert.equal(json.error, "payload too large");
  return `utf8 ${body.length} octets, string length ${asText.length}`;
});

await check("POST chunked over the cap without Content-Length", async () => {
  const head = jsonStringBytes(MAX_BODY_BYTES, "b");
  const { status, json } = await postChunked([head.subarray(0, 1024), head.subarray(1024), Buffer.from("x")]);
  assert.equal(status, 413);
  assert.equal(json.error, "payload too large");
});

const failed = results.filter((item) => !item.ok);
console.log(
  JSON.stringify(
    {
      base,
      total: results.length,
      passed: results.length - failed.length,
      failed: failed.length,
    },
    null,
    2,
  ),
);
if (failed.length) process.exit(1);
