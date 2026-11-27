#!/usr/bin/env node
/**
 * Prove the documented profiles:
 *   static preview  → dedicated artifact on the preview host (loopback)
 *   Next            → separate runtime, route /briefing
 *
 * Does not change preview-host auth, health, or path checks. Health is
 * accepted when `ok` is true; extra fields are ignored.
 *
 *   node tools/web-journey/prove-load.mjs
 *   node tools/web-journey/prove-load.mjs --with-next --port 4181 --next-port 3210
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ARTIFACT_FILES, buildManifest, hashArtifact } from "./provenance.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const artifactRoot = path.join(repoRoot, "fixtures", "web-journey", "static");

function readArg(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  return argv[index + 1] || fallback;
}

export async function startPreviewHost(port) {
  const proc = spawn(
    process.execPath,
    [
      path.join(repoRoot, "packages/preview-host/bin/preview-host.mjs"),
      "--root",
      artifactRoot,
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  let buffer = "";
  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
  });
  proc.stderr.on("data", (chunk) => {
    buffer += chunk.toString();
  });
  const started = Date.now();
  while (!buffer.includes("url:")) {
    if (proc.exitCode !== null) throw new Error(buffer || "preview host exited");
    if (Date.now() - started > 8000) throw new Error(buffer || "preview host did not print its url");
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  return proc;
}

async function get(url) {
  const response = await fetch(url);
  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: response.status,
    type: response.headers.get("content-type") || "",
    body,
  };
}

export async function staticGates(origin) {
  const gates = [];
  const page = await get(`${origin}/`);
  gates.push({
    id: "static-page",
    ok: page.status === 200 && page.body.includes(Buffer.from("promote-status")),
    detail: `GET / ${page.status}`,
  });
  const css = await get(`${origin}/assets/app.css`);
  gates.push({
    id: "static-css",
    ok: css.status === 200 && css.body.includes(Buffer.from(".proto-picker")),
    detail: `GET /assets/app.css ${css.status}`,
  });
  const js = await get(`${origin}/assets/app.js`);
  gates.push({
    id: "static-js",
    ok: js.status === 200 && js.body.includes(Buffer.from('promote(session, variant.id, "human")')),
    detail: `GET /assets/app.js ${js.status}`,
  });
  const model = await get(`${origin}/assets/model.mjs`);
  gates.push({
    id: "static-model",
    ok: model.status === 200 && model.body.includes(Buffer.from("Ateliê Lume")),
    detail: `GET /assets/model.mjs ${model.status}`,
  });
  const svg = await get(`${origin}/assets/mark.svg`);
  gates.push({
    id: "static-svg",
    ok: svg.status === 200 && svg.type.includes("svg") && svg.body.includes(Buffer.from("<svg")),
    detail: `GET /assets/mark.svg ${svg.status} ${svg.type}`,
  });
  const health = await get(`${origin}/healthz`);
  let healthOk = false;
  try {
    healthOk = JSON.parse(health.body.toString()).ok === true;
  } catch {
    healthOk = false;
  }
  gates.push({
    id: "static-health",
    ok: health.status === 200 && healthOk,
    detail: "GET /healthz ok:true",
  });
  return gates;
}

function cdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("chrome websocket failed")));
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const done = pending.get(message.id);
      pending.delete(message.id);
      done(message);
    }
  });
  return {
    async send(method, params = {}) {
      await opened;
      const msgId = ++id;
      const result = new Promise((resolve) => pending.set(msgId, resolve));
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return result;
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(client, expression) {
  const message = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (message.result?.exceptionDetails) {
    throw new Error(JSON.stringify(message.result.exceptionDetails));
  }
  return message.result?.result?.value;
}

async function waitFor(client, predicateSource, label) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const value = await evaluate(client, predicateSource);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`chrome timed out: ${label}`);
}

export async function chromeGates(origin) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "od-journey-"));
  const proc = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--user-data-dir=${dir}`,
      "--remote-debugging-port=0",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let debugPort = "";
  try {
    debugPort = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("chrome did not open a debug port")), 15000);
      const take = (chunk) => {
        const match = String(chunk).match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
        if (!match) return;
        clearTimeout(timer);
        resolve(match[1]);
      };
      proc.stderr.on("data", take);
      proc.stdout.on("data", take);
      proc.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`chrome exited ${code} before the debug port was ready`));
      });
    });

    const created = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(`${origin}/`)}`, {
      method: "PUT",
    });
    const tab = await created.json();
    const client = cdpClient(tab.webSocketDebuggerUrl);
    await client.send("Runtime.enable");
    const text = await waitFor(
      client,
      `document.body && document.body.innerText.includes("Capa do catálogo de outono") ? document.body.innerText : ""`,
      "list",
    );
    const resources = await evaluate(
      client,
      `performance.getEntriesByType("resource").map((entry) => entry.name).join("\\n")`,
    );
    const openStatus = await evaluate(client, `document.querySelector("#promote-status").textContent`);
    await evaluate(client, `document.querySelector('[data-filter="archive"]').click()`);
    const emptyText = await waitFor(
      client,
      `document.body && document.body.innerText.includes("Nenhum briefing") ? document.body.innerText : ""`,
      "empty",
    );
    await evaluate(client, `document.querySelector('[data-filter="all"]').click()`);
    await waitFor(
      client,
      `document.body && document.body.innerText.includes("BL-104") ? document.body.innerText : ""`,
      "list restored",
    );
    await evaluate(client, `document.querySelector('[data-action="error"]').click()`);
    const errorText = await waitFor(
      client,
      `document.body && document.body.innerText.includes("A fila não respondeu") ? document.body.innerText : ""`,
      "error",
    );
    await evaluate(client, `document.querySelector('[data-action="retry"]').click()`);
    await waitFor(
      client,
      `document.querySelector('[data-variant="quiet"][data-state="list"]') ? "ok" : ""`,
      "retry",
    );
    await evaluate(client, `document.querySelectorAll(".proto-picker-item")[1].click()`);
    await waitFor(
      client,
      `document.querySelector('[data-variant="ledger"]') ? "ok" : ""`,
      "ledger",
    );
    await evaluate(client, `document.querySelectorAll(".proto-picker-item")[2].click()`);
    await waitFor(
      client,
      `document.querySelector('[data-variant="split"] aside') ? "ok" : ""`,
      "split",
    );
    await evaluate(client, `document.querySelector("#promote").click()`);
    const promoted = await waitFor(
      client,
      `document.querySelector("#promote-status") && document.querySelector("#promote-status").textContent.includes("Promovida por escolha humana") ? document.querySelector("#promote-status").textContent : ""`,
      "promote",
    );
    await client.send("Page.enable");
    await client.send("Page.navigate", { url: `${origin}/?state=loading` });
    await waitFor(
      client,
      `document.querySelector('[data-state="loading"]') ? "ok" : ""`,
      "loading",
    );
    client.close();

    const assetOk = ["/assets/app.css", "/assets/app.js", "/assets/model.mjs", "/assets/mark.svg"].every((item) =>
      String(resources).includes(item),
    );
    const noToken = !String(resources).includes("token=");
    return [
      {
        id: "chrome-list",
        ok: text.includes("Capa do catálogo de outono") && text.includes("Direção aberta"),
        detail: "rendered list and open direction",
      },
      {
        id: "chrome-assets",
        ok: assetOk && noToken,
        detail: "css js model svg loaded without token query",
      },
      {
        id: "chrome-open",
        ok: String(openStatus).includes("Direção aberta"),
        detail: "promote status before the click",
      },
      { id: "chrome-empty", ok: emptyText.includes("Nenhum briefing"), detail: "archive filter" },
      { id: "chrome-error", ok: errorText.includes("A fila não respondeu"), detail: "simulated error" },
      { id: "chrome-ledger", ok: true, detail: "picker switched to Ledger" },
      { id: "chrome-split", ok: true, detail: "picker switched to Split" },
      {
        id: "chrome-promote",
        ok: String(promoted).includes("Promovida por escolha humana: Split"),
        detail: String(promoted),
      },
      { id: "chrome-loading", ok: true, detail: "query state=loading stays on the loading copy" },
    ];
  } finally {
    proc.kill("SIGKILL");
    await new Promise((resolve) => setTimeout(resolve, 300));
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function parseAssetPaths(html) {
  const found = new Set();
  const re = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
  let match;
  while ((match = re.exec(html))) found.add(match[1]);
  return [...found];
}

export async function nextGates(origin) {
  const gates = [];
  async function page(path, id, needles) {
    const response = await get(`${origin}${path}`);
    const text = response.body.toString("utf8");
    const ok = response.status === 200 && needles.every((needle) => text.includes(needle));
    gates.push({ id, ok, detail: `GET ${path} ${response.status}` });
    return text;
  }
  const home = await page("/briefing", "next-page", [
    "Ateliê Lume",
    "Direção aberta",
    'data-variant="quiet"',
    'data-axis="editorial-sparse"',
    "Capa do catálogo de outono",
  ]);
  await page("/briefing?filter=archive", "next-empty", [
    "Nenhum briefing com esse filtro",
    'data-state="empty"',
  ]);
  await page("/briefing?state=error", "next-error", [
    "A fila não respondeu",
    'data-state="error"',
  ]);
  await page("/briefing?state=loading", "next-loading", [
    "Carregando a fila do ateliê",
    'data-state="loading"',
  ]);
  await page("/briefing?v=ledger", "next-ledger", [
    'data-variant="ledger"',
    'data-axis="compact-scan"',
    'data-density="compact"',
  ]);
  await page("/briefing?v=split", "next-split", [
    'data-variant="split"',
    'data-axis="master-detail"',
    'data-pane="detail"',
  ]);
  const promoted = await get(
    `${origin}/briefing?v=quiet&filter=all&promoted=quiet&actor=human`,
  );
  const promotedText = promoted.body.toString("utf8");
  gates.push({
    id: "next-promote",
    ok:
      promoted.status === 200 &&
      promotedText.includes("Promovida por escolha humana") &&
      promotedText.includes('data-direction="promoted"'),
    detail: `GET promote form result ${promoted.status}`,
  });
  const bare = await get(`${origin}/briefing?promoted=quiet`);
  gates.push({
    id: "next-promote-guard",
    ok:
      bare.status === 200 &&
      bare.body.toString("utf8").includes("Direção aberta") &&
      !bare.body.toString("utf8").includes("Promovida por escolha humana"),
    detail: "promoted without actor=human stays open",
  });
  const assets = parseAssetPaths(home).slice(0, 2);
  let assetOk = assets.length > 0;
  for (const asset of assets) {
    const response = await get(`${origin}${asset}`);
    if (response.status !== 200 || response.body.length < 32) assetOk = false;
  }
  gates.push({
    id: "next-asset",
    ok: assetOk,
    detail: assets.length ? assets.join(" ") : "no /_next/static asset in the HTML",
  });
  return gates;
}

export async function startNext(port) {
  const proc = spawn("pnpm", ["exec", "next", "start", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: path.join(repoRoot, "examples", "web-seed"),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });
  let buffer = "";
  proc.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
  });
  proc.stderr.on("data", (chunk) => {
    buffer += chunk.toString();
  });
  const started = Date.now();
  while (!buffer.includes("Ready") && !buffer.includes("Error")) {
    if (proc.exitCode !== null) throw new Error(buffer || "next start exited");
    if (Date.now() - started > 20000) throw new Error(buffer || "next start timed out");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (buffer.includes("Error") && !buffer.includes("Ready")) {
    throw new Error(buffer);
  }
  return proc;
}

async function main() {
  const argv = process.argv.slice(2);
  const port = Number(readArg(argv, "--port", "4181"));
  const nextPort = Number(readArg(argv, "--next-port", "3210"));
  const withNext = argv.includes("--with-next");
  const withChrome = !argv.includes("--no-chrome");
  const origin = `http://127.0.0.1:${port}`;
  const host = await startPreviewHost(port);
  let nextProc = null;
  try {
    const gates = await staticGates(origin);
    if (withChrome) gates.push(...(await chromeGates(origin)));
    let localNext = null;
    if (withNext) {
      nextProc = await startNext(nextPort);
      localNext = `http://127.0.0.1:${nextPort}/briefing`;
      gates.push(...(await nextGates(`http://127.0.0.1:${nextPort}`)));
    }
    const shaResult = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    if (shaResult.status !== 0 || !shaResult.stdout.trim()) {
      throw new Error("git rev-parse HEAD failed");
    }
    const manifest = buildManifest({
      sha: shaResult.stdout.trim(),
      artifactHash: hashArtifact(artifactRoot),
      files: ARTIFACT_FILES,
      localStatic: `${origin}/`,
      localNext,
      deployed: null,
      gates,
      promoted: null,
    });
    const out = readArg(argv, "--out", "");
    if (out) fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
    const failed = gates.filter((gate) => !gate.ok);
    console.log(JSON.stringify({ ok: failed.length === 0, failed: failed.map((gate) => gate.id), manifest }, null, 2));
    return failed.length === 0 ? 0 : 1;
  } finally {
    host.kill("SIGTERM");
    nextProc?.kill("SIGTERM");
  }
}

const isDirect =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
