#!/usr/bin/env node
/**
 * OpenDesigma preview host — static files + /healthz + optional bearer token.
 * Zero npm dependencies. Node >= 20.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
};

function usage() {
  console.log(`Usage: od-preview-host [options]

  --root <dir>     Static root (default: .opendesigma/preview or ./public)
  --port <n>       Port (default: 4173, env OD_PREVIEW_PORT)
  --host <addr>    Bind address (default: 127.0.0.1, env OD_PREVIEW_HOST)
  --token <secret> Require Bearer / ?token= (env OD_PREVIEW_TOKEN)
  --help           Show this help

Health: GET /healthz (always public)
`);
}

function parseArgs(argv) {
  const out = {
    root: process.env.OD_PREVIEW_ROOT || null,
    port: Number(process.env.OD_PREVIEW_PORT || 4173),
    host: process.env.OD_PREVIEW_HOST || "127.0.0.1",
    token: process.env.OD_PREVIEW_TOKEN || null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      usage();
      process.exit(0);
    }
    if (a === "--root") out.root = argv[++i];
    else if (a === "--port") out.port = Number(argv[++i]);
    else if (a === "--host") out.host = argv[++i];
    else if (a === "--token") out.token = argv[++i];
    else {
      console.error(`Unknown arg: ${a}`);
      usage();
      process.exit(1);
    }
  }
  if (!Number.isFinite(out.port) || out.port < 1) {
    console.error("Invalid --port");
    process.exit(1);
  }
  return out;
}

function resolveRoot(configured) {
  if (configured) return path.resolve(configured);
  const cwdPreview = path.resolve(process.cwd(), ".opendesigma/preview");
  if (fs.existsSync(cwdPreview)) return cwdPreview;
  return path.join(PKG_ROOT, "public");
}

function authorized(req, url, token) {
  if (!token) return true;
  const header = req.headers.authorization || "";
  if (header === `Bearer ${token}`) return true;
  if (url.searchParams.get("token") === token) return true;
  return false;
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(root, cleaned);
  const rootResolved = path.resolve(root) + path.sep;
  if (!full.startsWith(rootResolved) && full !== path.resolve(root)) {
    return null;
  }
  return full;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  stream.pipe(res);
  stream.on("error", () => {
    if (!res.headersSent) send(res, 500, "Internal error\n", { "Content-Type": "text/plain" });
    else res.destroy();
  });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolveRoot(opts.root);

  if (!fs.existsSync(root)) {
    console.error(`Root not found: ${root}`);
    console.error("Create it or pass --root <dir> (demo: --root packages/preview-host/public)");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${opts.host}:${opts.port}`);

    if (req.method === "GET" && url.pathname === "/healthz") {
      return send(
        res,
        200,
        {
          ok: true,
          service: "opendesigma-preview-host",
          root,
          startedAt,
          auth: Boolean(opts.token),
        },
        { "Content-Type": "application/json; charset=utf-8" },
      );
    }

    if (!authorized(req, url, opts.token)) {
      return send(res, 401, "Unauthorized\n", { "Content-Type": "text/plain; charset=utf-8" });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return send(res, 405, "Method Not Allowed\n", { "Content-Type": "text/plain; charset=utf-8" });
    }

    let target = safeJoin(root, url.pathname === "/" ? "/index.html" : url.pathname);
    if (!target) return send(res, 403, "Forbidden\n", { "Content-Type": "text/plain; charset=utf-8" });

    let stat;
    try {
      stat = fs.statSync(target);
    } catch {
      return send(res, 404, "Not Found\n", { "Content-Type": "text/plain; charset=utf-8" });
    }

    if (stat.isDirectory()) {
      target = path.join(target, "index.html");
      try {
        stat = fs.statSync(target);
      } catch {
        return send(res, 404, "Not Found\n", { "Content-Type": "text/plain; charset=utf-8" });
      }
    }

    if (!stat.isFile()) {
      return send(res, 404, "Not Found\n", { "Content-Type": "text/plain; charset=utf-8" });
    }

    if (req.method === "HEAD") {
      const ext = path.extname(target).toLowerCase();
      return send(res, 200, "", {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Length": String(stat.size),
      });
    }

    return serveFile(res, target);
  });

  server.listen(opts.port, opts.host, () => {
    const base = `http://${opts.host}:${opts.port}`;
    console.log(`OpenDesigma preview host`);
    console.log(`  root:  ${root}`);
    console.log(`  url:   ${base}/`);
    console.log(`  health:${base}/healthz`);
    console.log(`  auth:  ${opts.token ? "token required" : "off (loopback ok)"}`);
  });
}

main();
