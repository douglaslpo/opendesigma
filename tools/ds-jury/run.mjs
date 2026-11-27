#!/usr/bin/env node
/**
 * break-ui → review-ui → ds-lint → design-jury.
 *
 *   node tools/ds-jury/run.mjs
 *   node tools/ds-jury/run.mjs --browser --port 4317 --shots /tmp/ds-jury
 *
 * Exit 0 when the mechanical verdict is SHIP. Exit 1 otherwise. Exit 2 on usage.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PIPELINE, assessBreak, assessReview, scoreJury } from "./pipeline.mjs";
import { runBrowser } from "./browser.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const seedDir = path.join(REPO_ROOT, "examples", "web-seed");
const mobileTokens = path.join(REPO_ROOT, "examples", "mobile-seed", "tokens.ts");

function parseArgs(argv) {
  const opts = { browser: false, port: 4317, shots: "", out: "" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--browser") opts.browser = true;
    else if (arg === "--no-browser") opts.browser = false;
    else if (arg === "--port") opts.port = Number(argv[++i]);
    else if (arg === "--shots") opts.shots = argv[++i];
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else return { error: `unknown option: ${arg}` };
  }
  if (opts.browser && !Number.isInteger(opts.port)) return { error: "--port needs an integer" };
  return { opts };
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function sha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBench(port, child) {
  const url = `http://127.0.0.1:${port}/ds-review`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) return null;
    try {
      const res = await fetch(url);
      if (res.ok) return url;
    } catch {
      // next start is still binding.
    }
    await sleep(250);
  }
  return null;
}

function startNext(port) {
  const child = spawn("pnpm", ["exec", "next", "start", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: seedDir,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });
  child.logs = "";
  const take = (chunk) => {
    child.logs = `${child.logs}${chunk}`.slice(-2000);
  };
  child.stdout?.on("data", take);
  child.stderr?.on("data", take);
  return child;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.error || parsed.opts?.help) {
    console.error(
      "Usage: node tools/ds-jury/run.mjs [--browser] [--port <n>] [--shots <dir>] [--out <file>]",
    );
    if (parsed.error) console.error(parsed.error);
    process.exit(parsed.error ? 2 : 0);
  }
  const opts = parsed.opts;
  const benchSrc = read("examples/web-seed/app/ds-review/bench.tsx");
  const globalsSrc = read("examples/web-seed/app/globals.css");
  const buttonSrc = read("examples/web-seed/components/ui/button.tsx");

  const stages = [];
  const breakReport = assessBreak(benchSrc, globalsSrc);
  stages.push({ id: "break-ui", ok: breakReport.ok, failures: breakReport.failures });

  const review = assessReview({ benchSrc, buttonSrc, globalsSrc });
  stages.push({ id: "review-ui", ok: review.ok, failures: review.failures });

  const lintMod = await import(pathToFileURL(path.join(REPO_ROOT, "tools", "ds-lint", "ds-lint.mjs")).href);
  const lint = lintMod.lintSeed(seedDir, { mobileTokensPath: mobileTokens });
  const figma = lintMod.figmaMappingReport(seedDir, path.dirname(mobileTokens));
  stages.push({
    id: "ds-lint",
    ok: lint.ok,
    summary: lint.summary,
    findingIds: lint.findings.map((row) => row.id),
  });

  let browser = null;
  let next;
  if (opts.browser) {
    if (!fs.existsSync(path.join(seedDir, "node_modules", "next"))) {
      browser = {
        ok: false,
        failures: [{ id: "browser", message: "examples/web-seed/node_modules is missing; run pnpm install" }],
        shots: [],
      };
    } else if (!fs.existsSync(path.join(seedDir, ".next"))) {
      browser = {
        ok: false,
        failures: [{ id: "browser", message: "examples/web-seed/.next is missing; run pnpm build" }],
        shots: [],
      };
    } else {
      next = startNext(opts.port);
      const ready = await waitForBench(opts.port, next);
      if (!ready) {
        browser = {
          ok: false,
          failures: [
            {
              id: "browser",
              message: `next did not serve /ds-review on ${opts.port}`,
              log: next?.logs || "",
            },
          ],
          shots: [],
        };
      } else {
        browser = await runBrowser({
          baseUrl: `http://127.0.0.1:${opts.port}`,
          shotsDir: opts.shots || undefined,
        });
      }
    }
  }
  stages.push({
    id: "browser",
    ran: Boolean(opts.browser),
    ok: browser ? browser.ok : false,
    failures: browser?.failures || [],
  });

  const score = scoreJury({ lint, browser, review, breakReport });
  stages.push({ id: "design-jury", ok: score.verdict === "SHIP", verdict: score.verdict });

  const report = {
    pipeline: PIPELINE,
    sha: sha(),
    ok: score.verdict === "SHIP",
    stages,
    score,
    figma,
    tokenSemantics: lint.summary.tokenSemantics,
    browser: browser
      ? { ok: browser.ok, failures: browser.failures, checks: browser.checks, shots: browser.shots }
      : { ran: false, reason: "pass --browser to probe Chrome" },
    manual: {
      separated: true,
      automated: [
        "keyboard tab order",
        "focus ring",
        "accessible name",
        "contrast",
        "click and Enter feedback",
        "320px width",
        "32px root font",
        "empty, error, and loading states",
        "extreme strings",
      ],
      notAutomated: [
        "VoiceOver, NVDA, or TalkBack announcement",
        "editorial craft beyond the anti-slop signatures",
      ],
    },
  };

  const text = JSON.stringify(report, null, 2);
  if (opts.out) fs.writeFileSync(opts.out, `${text}\n`);
  console.log(text);
  console.error(
    `jury ${score.verdict}  DS ${score.ds}  A11y ${score.a11y}  Craft ${score.craft}  blockers ${score.blockers}`,
  );
  if (next) next.kill("SIGTERM");
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
