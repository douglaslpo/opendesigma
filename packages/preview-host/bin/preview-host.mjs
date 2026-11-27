#!/usr/bin/env node
/**
 * OpenDesigma preview host — static files, public /healthz, optional auth.
 * Zero npm dependencies. Node >= 20.
 *
 * Loopback is the default bind. Credentials never travel in the URL:
 * programmatic clients send Authorization: Bearer, browsers POST the token
 * once and then load the page and assets with an HttpOnly session cookie.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");

const COOKIE = "od_preview_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SESSION_MAX = 64;
const BODY_LIMIT = 4096;

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

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function usage() {
  console.log(`Usage: od-preview-host [options]

  --root <dir>     Static root (default: .opendesigma/preview or ./public)
  --port <n>       Port (default: 4173, env OD_PREVIEW_PORT)
  --host <addr>    Bind address (default: 127.0.0.1, env OD_PREVIEW_HOST)
  --token <secret> Require auth (env OD_PREVIEW_TOKEN). Not accepted in URLs.
  --help           Show this help

Health: GET /healthz (always public, body {"ok":true})
Auth:   Authorization: Bearer <token>, or a session cookie from
        POST /__preview/session (browser: GET /__preview/login).
        ?token= is rejected.
`);
}

export function isLoopbackHost(host) {
  const h = String(host).trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "::1") return true;
  return /^127(?:\.\d{1,3}){3}$/.test(h);
}

export function bindAllowed(host, token) {
  if (isLoopbackHost(host)) return true;
  return Boolean(token);
}

export function parseArgs(argv, env = process.env) {
  const out = {
    root: env.OD_PREVIEW_ROOT || null,
    port: Number(env.OD_PREVIEW_PORT || 4173),
    host: env.OD_PREVIEW_HOST || "127.0.0.1",
    token: env.OD_PREVIEW_TOKEN || null,
    help: false,
    error: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
      return out;
    }
    const needs = { "--root": "root", "--port": "port", "--host": "host", "--token": "token" };
    if (Object.prototype.hasOwnProperty.call(needs, a)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) {
        out.error = `Missing value for ${a}`;
        return out;
      }
      i += 1;
      if (a === "--port") out.port = Number(value);
      else out[needs[a]] = value;
      continue;
    }
    out.error = `Unknown arg: ${a}`;
    return out;
  }
  if (!Number.isInteger(out.port) || out.port < 1 || out.port > 65535) {
    out.error = "Invalid --port";
  }
  if (out.token === "") out.token = null;
  out.host = String(out.host).trim().replace(/^\[|\]$/g, "");
  return out;
}

function resolveRoot(configured) {
  if (configured) return path.resolve(configured);
  const cwdPreview = path.resolve(process.cwd(), ".opendesigma/preview");
  if (fs.existsSync(cwdPreview)) return cwdPreview;
  return path.join(PKG_ROOT, "public");
}

function isFilesystemRoot(dir) {
  return path.resolve(dir) === path.parse(dir).root;
}

function openRoot(root) {
  const rootReal = fs.realpathSync(root);
  const stat = fs.statSync(rootReal);
  if (!stat.isDirectory()) {
    const err = new Error("Preview root is not a directory");
    err.code = "ENOTDIR";
    throw err;
  }
  if (isFilesystemRoot(rootReal)) {
    const err = new Error("Refusing to serve the filesystem root");
    err.code = "UNSAFE_ROOT";
    throw err;
  }
  return rootReal;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

function isInsideRoot(rootReal, candidate) {
  const rel = path.relative(rootReal, candidate);
  if (rel === "") return true;
  if (rel === ".." || rel.startsWith(`..${path.sep}`)) return false;
  if (path.isAbsolute(rel)) return false;
  return true;
}

function createSessionStore() {
  const map = new Map();
  function prune(now = Date.now()) {
    for (const [id, exp] of map) {
      if (exp <= now) map.delete(id);
    }
  }
  return {
    create() {
      prune();
      while (map.size >= SESSION_MAX) {
        const oldest = map.keys().next().value;
        map.delete(oldest);
      }
      const id = randomBytes(32).toString("hex");
      map.set(id, Date.now() + SESSION_TTL_MS);
      return id;
    },
    has(id) {
      if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) return false;
      const exp = map.get(id);
      if (!exp) return false;
      if (exp <= Date.now()) {
        map.delete(id);
        return false;
      }
      return true;
    },
    delete(id) {
      map.delete(id);
    },
  };
}

function cookieHeader(id, clear = false) {
  const value = clear ? "" : id;
  const maxAge = clear ? 0 : Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw || Array.isArray(raw)) return null;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function bearerToken(req) {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match ? match[1] : null;
}

function wantsHtml(req) {
  const accept = req.headers.accept;
  if (!accept || Array.isArray(accept)) return false;
  return accept.toLowerCase().includes("text/html");
}

function contentType(req) {
  const raw = req.headers["content-type"];
  if (!raw || Array.isArray(raw)) return "";
  return raw.split(";")[0].trim().toLowerCase();
}

function hasTokenParam(url) {
  for (const key of url.searchParams.keys()) {
    if (key.toLowerCase() === "token") return true;
  }
  return false;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        finish(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > limit) finish(null);
      else finish(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (err) => {
      if (!settled) reject(err);
    });
  });
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { ...BASE_HEADERS, ...headers });
  res.end(payload);
}

function loginHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenDesigma preview</title>
  </head>
  <body>
    <main>
      <h1>Open preview</h1>
      <p>The token is sent in this form body and stored as an HttpOnly session cookie. It is not put in the URL.</p>
      <form method="post" action="/__preview/session">
        <label for="token">Token</label>
        <input id="token" name="token" type="password" autocomplete="current-password" required />
        <button type="submit">Continue</button>
      </form>
    </main>
  </body>
</html>
`;
}

function resolveStatic(rootReal, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { status: 400 };
  }
  if (decoded.includes("\0")) return { status: 400 };

  const segments = [];
  for (const segment of decoded.replace(/\\/g, "/").split("/")) {
    if (segment === "" || segment === ".") continue;
    segments.push(segment);
  }
  const candidate = path.resolve(rootReal, ...segments);
  if (!isInsideRoot(rootReal, candidate)) return { status: 403 };

  let cursor = candidate;
  const missing = [];
  let realExisting = null;
  while (true) {
    try {
      realExisting = fs.realpathSync(cursor);
      break;
    } catch (err) {
      if (!err || (err.code !== "ENOENT" && err.code !== "ENOTDIR")) return { status: 404 };
      const parent = path.dirname(cursor);
      if (parent === cursor) return { status: 404 };
      missing.push(path.basename(cursor));
      cursor = parent;
    }
  }
  if (!isInsideRoot(rootReal, realExisting)) return { status: 403 };
  if (missing.length > 0) {
    const reconstructed = path.resolve(realExisting, ...missing.reverse());
    if (!isInsideRoot(rootReal, reconstructed)) return { status: 403 };
    return { status: 404 };
  }

  let stat;
  try {
    stat = fs.lstatSync(realExisting);
  } catch {
    return { status: 404 };
  }
  if (stat.isSymbolicLink()) return { status: 403 };
  if (stat.isDirectory()) {
    const indexCandidate = path.resolve(realExisting, "index.html");
    if (!isInsideRoot(rootReal, indexCandidate)) return { status: 403 };
    let indexReal;
    try {
      indexReal = fs.realpathSync(indexCandidate);
    } catch {
      return { status: 404 };
    }
    if (!isInsideRoot(rootReal, indexReal)) return { status: 403 };
    let indexStat;
    try {
      indexStat = fs.lstatSync(indexReal);
    } catch {
      return { status: 404 };
    }
    if (indexStat.isSymbolicLink() || !indexStat.isFile()) return { status: 404 };
    return { status: 200, file: indexReal, stat: indexStat };
  }
  if (!stat.isFile()) return { status: 404 };
  return { status: 200, file: realExisting, stat };
}

function serveFile(res, filePath, stat, method) {
  let fd = null;
  if (method !== "HEAD") {
    try {
      const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0);
      fd = fs.openSync(filePath, flags);
    } catch {
      return send(res, 403, "Forbidden\n", { "Content-Type": "text/plain; charset=utf-8" });
    }
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    ...BASE_HEADERS,
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": String(stat.size),
  });
  if (method === "HEAD") {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath, { fd, autoClose: true });
  stream.pipe(res);
  stream.on("error", () => {
    if (!res.headersSent) {
      send(res, 500, "Internal error\n", { "Content-Type": "text/plain; charset=utf-8" });
    } else {
      res.destroy();
    }
  });
}

function requestAuthorized(req, ctx) {
  const bearer = bearerToken(req);
  if (bearer && safeEqual(bearer, ctx.token)) return true;
  const sid = readCookie(req, COOKIE);
  return Boolean(sid && ctx.store.has(sid));
}

async function establishSession(req, res, ctx) {
  const raw = await readBody(req, BODY_LIMIT);
  if (raw === null) {
    return send(res, 413, "Payload Too Large\n", { "Content-Type": "text/plain; charset=utf-8" });
  }
  const ctype = contentType(req);
  let fromBody = null;
  if (ctype === "application/json") {
    try {
      const data = JSON.parse(raw || "null");
      if (data && typeof data === "object" && typeof data.token === "string") fromBody = data.token;
    } catch {
      return send(res, 400, "Bad Request\n", { "Content-Type": "text/plain; charset=utf-8" });
    }
  } else if (ctype === "application/x-www-form-urlencoded") {
    fromBody = new URLSearchParams(raw).get("token");
  }
  const fromHeader = bearerToken(req);
  const ok =
    (fromBody !== null && safeEqual(fromBody, ctx.token)) ||
    (fromHeader !== null && safeEqual(fromHeader, ctx.token));
  if (!ok) {
    return send(res, 401, "Unauthorized\n", {
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": 'Bearer realm="opendesigma-preview"',
    });
  }
  const id = ctx.store.create();
  const headers = { "Set-Cookie": cookieHeader(id) };
  if (ctype === "application/x-www-form-urlencoded") {
    res.writeHead(303, { ...BASE_HEADERS, ...headers, Location: "/" });
    res.end();
    return;
  }
  return send(res, 200, { ok: true }, { ...headers, "Content-Type": "application/json; charset=utf-8" });
}

function clearSession(req, res, ctx) {
  const sid = readCookie(req, COOKIE);
  if (sid) ctx.store.delete(sid);
  res.writeHead(204, { ...BASE_HEADERS, "Set-Cookie": cookieHeader("", true) });
  res.end();
}

async function handle(req, res, ctx) {
  let url;
  try {
    url = new URL(req.url || "/", "http://127.0.0.1");
  } catch {
    return send(res, 400, "Bad Request\n", { "Content-Type": "text/plain; charset=utf-8" });
  }

  if (hasTokenParam(url)) {
    return send(res, 400, "Credentials in the URL are not accepted\n", {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }

  if (url.pathname === "/healthz" && (req.method === "GET" || req.method === "HEAD")) {
    return send(res, 200, req.method === "HEAD" ? "" : { ok: true }, {
      "Content-Type": "application/json; charset=utf-8",
    });
  }

  if (ctx.token && url.pathname === "/__preview/login" && req.method === "GET") {
    return send(res, 200, loginHtml(), { "Content-Type": "text/html; charset=utf-8" });
  }
  if (ctx.token && url.pathname === "/__preview/session" && req.method === "POST") {
    return establishSession(req, res, ctx);
  }
  if (ctx.token && url.pathname === "/__preview/logout" && req.method === "POST") {
    return clearSession(req, res, ctx);
  }

  if (ctx.token && !requestAuthorized(req, ctx)) {
    if (req.method === "GET" && wantsHtml(req)) {
      res.writeHead(303, { ...BASE_HEADERS, Location: "/__preview/login" });
      res.end();
      return;
    }
    return send(res, 401, "Unauthorized\n", {
      "Content-Type": "text/plain; charset=utf-8",
      "WWW-Authenticate": 'Bearer realm="opendesigma-preview"',
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed\n", {
      "Content-Type": "text/plain; charset=utf-8",
      Allow: "GET, HEAD",
    });
  }

  const resolved = resolveStatic(ctx.rootReal, url.pathname);
  if (resolved.status === 200) return serveFile(res, resolved.file, resolved.stat, req.method);
  if (resolved.status === 400) {
    return send(res, 400, "Bad Request\n", { "Content-Type": "text/plain; charset=utf-8" });
  }
  if (resolved.status === 403) {
    return send(res, 403, "Forbidden\n", { "Content-Type": "text/plain; charset=utf-8" });
  }
  return send(res, 404, "Not Found\n", { "Content-Type": "text/plain; charset=utf-8" });
}

export function createPreviewServer({ root, token = null } = {}) {
  const rootReal = openRoot(root);
  const ctx = {
    rootReal,
    token: token ? String(token) : null,
    store: createSessionStore(),
  };
  return http.createServer((req, res) => {
    handle(req, res, ctx).catch(() => {
      if (!res.headersSent) {
        send(res, 500, "Internal error\n", { "Content-Type": "text/plain; charset=utf-8" });
      } else {
        res.destroy();
      }
    });
  });
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    process.exit(0);
  }
  if (opts.error) {
    console.error(opts.error);
    usage();
    process.exit(1);
  }
  if (!bindAllowed(opts.host, opts.token)) {
    console.error("Refusing to bind a non-loopback host without OD_PREVIEW_TOKEN.");
    process.exit(1);
  }

  const root = resolveRoot(opts.root);
  if (!fs.existsSync(root)) {
    console.error(`Root not found: ${root}`);
    console.error("Create it or pass --root <dir> (demo: --root packages/preview-host/public)");
    process.exit(1);
  }

  let server;
  try {
    server = createPreviewServer({ root, token: opts.token });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  server.on("error", (err) => {
    console.error(`Failed to bind preview host (${err.code || "error"})`);
    process.exit(1);
  });
  server.listen(opts.port, opts.host, () => {
    const base = `http://${opts.host}:${opts.port}`;
    console.log("OpenDesigma preview host");
    console.log(`  root:  ${root}`);
    console.log(`  url:   ${base}/`);
    console.log(`  health:${base}/healthz`);
    console.log(`  auth:  ${opts.token ? "bearer or session cookie" : "off (loopback)"}`);
  });
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
