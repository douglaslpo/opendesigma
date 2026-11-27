import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  bindAllowed,
  createPreviewServer,
  isLoopbackHost,
  parseArgs,
} from "../bin/preview-host.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, "..");
const FIXTURE = path.join(PKG, "fixtures", "publication");
const BIN = path.join(PKG, "bin", "preview-host.mjs");
const PUBLIC = path.join(PKG, "public");
const TOKEN = "fixture-token";
const OUTSIDE = "outside-secret-marker";

function cleanEnv(extra = {}) {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME || "/tmp",
    TMPDIR: process.env.TMPDIR || "/tmp",
    ...extra,
  };
}

function runOnce(args, { timeout = 3000, env = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], { env: cleanEnv(env) });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ code: null, stdout, stderr, timedOut: true });
    }, timeout);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut: false });
    });
  });
}

function startHost(args, env = {}) {
  const child = spawn(process.execPath, [BIN, ...args], { env: cleanEnv(env) });
  let stdout = "";
  let stderr = "";
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`startup timeout\n${stdout}\n${stderr}`)), 4000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes("health:")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`exited ${code}\n${stderr}`));
    });
  });
  return {
    child,
    ready,
    output: () => ({ stdout, stderr }),
    stop() {
      child.kill("SIGTERM");
      return new Promise((resolve) => child.on("exit", resolve));
    },
  };
}

async function withServer(opts, fn) {
  const server = createPreviewServer(opts);
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (err) => (err ? reject(err) : resolve()));
  });
  const { port } = server.address();
  try {
    await fn({ port, origin: `http://127.0.0.1:${port}` });
  } finally {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
}

function rawRequest(port, target) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    });
    const chunks = [];
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    socket.on("error", reject);
  });
}

function statusOf(raw) {
  const match = /^HTTP\/1\.1 (\d+)/.exec(raw);
  assert.ok(match, raw.slice(0, 120));
  return Number(match[1]);
}

function cookiePair(setCookie) {
  assert.ok(setCookie, "missing set-cookie");
  return setCookie.split(";")[0];
}

test("loopback stays the default and non-loopback requires a token", () => {
  const defaults = parseArgs([], {});
  assert.equal(defaults.host, "127.0.0.1");
  assert.equal(defaults.port, 4173);
  assert.equal(defaults.token, null);
  assert.equal(defaults.error, null);

  assert.equal(isLoopbackHost("127.0.0.1"), true);
  assert.equal(isLoopbackHost("127.0.0.2"), true);
  assert.equal(isLoopbackHost("[::1]"), true);
  assert.equal(isLoopbackHost("localhost"), true);
  assert.equal(isLoopbackHost("0.0.0.0"), false);
  assert.equal(isLoopbackHost("::"), false);
  assert.equal(isLoopbackHost("10.0.0.8"), false);

  assert.equal(bindAllowed("127.0.0.1", null), true);
  assert.equal(bindAllowed("0.0.0.0", null), false);
  assert.equal(bindAllowed("0.0.0.0", TOKEN), true);
  assert.equal(parseArgs(["--host", "0.0.0.0"], {}).host, "0.0.0.0");
  assert.equal(parseArgs(["--port"], {}).error, "Missing value for --port");
  assert.equal(parseArgs(["--token"], {}).error, "Missing value for --token");
  assert.equal(parseArgs(["--port", "0"], {}).error, "Invalid --port");
  assert.equal(parseArgs([], { OD_PREVIEW_TOKEN: "" }).token, null);
  assert.equal(parseArgs(["--host", "10.0.0.8"], { OD_PREVIEW_HOST: "127.0.0.1" }).host, "10.0.0.8");
});

test("health stays public and omits local details", async () => {
  await withServer({ root: FIXTURE, token: TOKEN }, async ({ origin }) => {
    const res = await fetch(`${origin}/healthz`);
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.equal(text, '{"ok":true}');
    assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    const body = JSON.parse(text);
    assert.deepEqual(Object.keys(body), ["ok"]);
    assert.equal(text.includes(FIXTURE), false);
    assert.equal(text.includes("startedAt"), false);
    assert.equal(text.includes("auth"), false);

    const head = await fetch(`${origin}/healthz`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const leaked = await fetch(`${origin}/healthz?token=${TOKEN}`);
    assert.equal(leaked.status, 400);
    assert.equal((await leaked.text()).includes(TOKEN), false);
    const mixedCase = await fetch(`${origin}/?Token=${TOKEN}`);
    assert.equal(mixedCase.status, 400);
  });
});

test("browser session loads the page and assets without credentials in URLs", async () => {
  await withServer({ root: FIXTURE, token: TOKEN }, async ({ origin }) => {
    const anon = await fetch(`${origin}/`, { headers: { Accept: "text/html" }, redirect: "manual" });
    assert.equal(anon.status, 303);
    assert.equal(anon.headers.get("location"), "/__preview/login");

    const api = await fetch(`${origin}/assets/app.css`);
    assert.equal(api.status, 401);

    const login = await fetch(`${origin}/__preview/login`);
    const loginHtml = await login.text();
    assert.equal(login.status, 200);
    assert.match(loginHtml, /action="\/__preview\/session"/);
    assert.equal(loginHtml.includes("?"), false);
    assert.equal(loginHtml.includes(TOKEN), false);

    const posted = await fetch(`${origin}/__preview/session`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: TOKEN }).toString(),
      redirect: "manual",
    });
    assert.equal(posted.status, 303);
    assert.equal(posted.headers.get("location"), "/");
    const setCookie = posted.headers.getSetCookie()[0];
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);
    assert.match(setCookie, /Path=\//);
    assert.equal(setCookie.includes(TOKEN), false);
    const pair = cookiePair(setCookie);
    assert.match(pair, /^od_preview_session=[a-f0-9]{64}$/);

    const pageUrl = `${origin}/`;
    const page = await fetch(pageUrl, { headers: { Cookie: pair, Accept: "text/html" } });
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(html, /fixture-ok/);
    const assets = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(assets, ["/assets/app.css", "/assets/mark.svg", "/assets/app.js"]);

    const fetched = [pageUrl];
    for (const asset of assets) {
      const url = new URL(asset, origin);
      fetched.push(url.href);
      assert.equal(url.search, "");
      assert.equal(url.href.includes(TOKEN), false);
      const res = await fetch(url, { headers: { Cookie: pair } });
      assert.equal(res.status, 200, asset);
      const body = await res.text();
      assert.equal(body.includes("fixture-"), true, asset);
      assert.equal(body.includes(TOKEN), false);
    }
    assert.equal(fetched.every((url) => !new URL(url).search.includes("token")), true);

    const head = await fetch(`${origin}/assets/app.css`, { method: "HEAD", headers: { Cookie: pair } });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const rejected = await fetch(`${origin}/assets/app.js?token=${TOKEN}`, { headers: { Cookie: pair } });
    assert.equal(rejected.status, 400);
    assert.equal((await rejected.text()).includes(TOKEN), false);

    const wrong = await fetch(`${origin}/__preview/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "nope" }),
    });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.headers.getSetCookie().length, 0);

    const json = await fetch(`${origin}/__preview/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: TOKEN }),
    });
    assert.equal(json.status, 200);
    assert.deepEqual(await json.json(), { ok: true });
    assert.equal(json.headers.getSetCookie()[0].includes(TOKEN), false);

    const bearerPage = await fetch(`${origin}/`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    assert.equal(bearerPage.status, 200);
    const bearerAsset = await fetch(`${origin}/assets/app.css`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    assert.equal(bearerAsset.status, 200);
    assert.match(await bearerAsset.text(), /fixture-css/);

    const logout = await fetch(`${origin}/__preview/logout`, { method: "POST", headers: { Cookie: pair } });
    assert.equal(logout.status, 204);
    const after = await fetch(`${origin}/`, { headers: { Cookie: pair } });
    assert.equal(after.status, 401);
  });
});

test("open preview still serves the demo without a token", async () => {
  await withServer({ root: PUBLIC }, async ({ origin }) => {
    const page = await fetch(`${origin}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /OpenDesigma/);
    const head = await fetch(`${origin}/`, { method: "HEAD" });
    assert.equal(head.status, 200);
    const login = await fetch(`${origin}/__preview/login`);
    assert.equal(login.status, 404);
  });
});

test("served paths stay inside the root, including symlink escapes", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "od-preview-"));
  const root = path.join(tmp, "root");
  const outside = path.join(tmp, "outside");
  fs.cpSync(FIXTURE, root, { recursive: true });
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, "secret.txt"), OUTSIDE);
  fs.writeFileSync(path.join(tmp, "secret.txt"), OUTSIDE);
  fs.symlinkSync(path.join(outside, "secret.txt"), path.join(root, "leak.txt"));
  fs.symlinkSync(outside, path.join(root, "leakdir"));
  fs.symlinkSync(path.join(root, "assets", "app.css"), path.join(root, "alias.css"));
  fs.symlinkSync("/", path.join(tmp, "whole-fs"));

  try {
    assert.throws(() => createPreviewServer({ root: "/" }), /filesystem root/);
    assert.throws(() => createPreviewServer({ root: path.join(tmp, "whole-fs") }), /filesystem root/);

    await withServer({ root }, async ({ port, origin }) => {
      const leak = await fetch(`${origin}/leak.txt`);
      assert.equal(leak.status, 403);
      assert.equal(await leak.text(), "Forbidden\n");

      const leakDir = await fetch(`${origin}/leakdir/secret.txt`);
      assert.equal(leakDir.status, 403);
      assert.equal((await leakDir.text()).includes(OUTSIDE), false);

      const alias = await fetch(`${origin}/alias.css`);
      assert.equal(alias.status, 200);
      assert.match(await alias.text(), /fixture-css/);

      const listing = await fetch(`${origin}/assets/`);
      assert.equal(listing.status, 404);
      assert.equal((await listing.text()).includes("app.css"), false);

      const encoded = await rawRequest(port, "/..%2fsecret.txt");
      assert.equal(statusOf(encoded), 403);
      assert.equal(encoded.includes(OUTSIDE), false);

      const dots = await rawRequest(port, "/%2e%2e/%2e%2e/secret.txt");
      assert.equal(dots.includes(OUTSIDE), false);
      assert.notEqual(statusOf(dots), 200);

      const bad = await rawRequest(port, "/%");
      assert.equal(statusOf(bad), 400);
      const nul = await rawRequest(port, "/%00");
      assert.equal(statusOf(nul), 400);

      const still = await fetch(`${origin}/`);
      assert.equal(still.status, 200);
      assert.match(await still.text(), /fixture-ok/);
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("CLI keeps loopback open and refuses a wide bind without a token", async () => {
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));

  const refused = await runOnce(["--host", "0.0.0.0", "--root", PUBLIC, "--port", String(port)]);
  assert.equal(refused.timedOut, false);
  assert.equal(refused.code, 1);
  assert.match(refused.stderr, /non-loopback/);
  assert.equal(refused.stdout.includes("url:"), false);

  const fromEnv = await runOnce(["--root", PUBLIC, "--port", String(port)], {
    env: { OD_PREVIEW_HOST: "0.0.0.0" },
  });
  assert.equal(fromEnv.code, 1);

  const help = await runOnce(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /session cookie/);
  assert.match(help.stdout, /\?token= is rejected/);

  const host = startHost(["--root", PUBLIC, "--port", String(port)]);
  try {
    await host.ready;
    const { stdout } = host.output();
    assert.match(stdout, /127\.0\.0\.1/);
    assert.match(stdout, /auth:\s+off \(loopback\)/);
    assert.equal(stdout.includes(TOKEN), false);
    const health = await fetch(`http://127.0.0.1:${port}/healthz`);
    const text = await health.text();
    assert.equal(text, '{"ok":true}');
    assert.equal(text.includes(PUBLIC), false);
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
  } finally {
    await host.stop();
  }
});
