#!/usr/bin/env node
/**
 * OpenDesigma MVP eval runner.
 *
 * Usage: node evals/run.mjs [--skip-build] [--only <id>] [--out <file>]
 *
 * Exit 0 — every executed check passed (skipped checks do not fail the run).
 * Exit 1 — at least one executed check failed.
 * Exit 2 — usage error, or the runner itself failed before producing a verdict.
 *
 * Stdout is always one JSON document. Human lines go to stderr.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { USAGE, buildSummary, parseArgs } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedDir = path.join(root, "examples", "web-seed");

const CHECK_MODULES = [
  "./checks/design-contract.mjs",
  "./checks/ds-reuse.mjs",
  "./checks/ds-lint.mjs",
  "./checks/context7-map.mjs",
  "./checks/a11y-smoke.mjs",
  "./checks/mobile-path.mjs",
  "./checks/backend-path.mjs",
  "./checks/build-smoke.mjs",
];

function readSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status === 0 && result.stdout) return result.stdout.trim();
  return process.env.GITHUB_SHA || null;
}

function publish(summary, outPath) {
  const text = JSON.stringify(summary, null, 2);
  if (outPath) fs.writeFileSync(outPath, `${text}\n`, "utf8");
  console.log(text);
}

function printUsage(knownIds) {
  console.error(USAGE);
  if (knownIds?.length) console.error(`Checks: ${knownIds.join(", ")}`);
  console.error("Exit 0: every executed check passed.");
  console.error("Exit 1: at least one executed check failed.");
  console.error("Exit 2: usage error (unknown option, missing value, or unknown --only id).");
}

async function loadChecks() {
  const loaded = [];
  for (const modPath of CHECK_MODULES) {
    const mod = await import(pathToFileURL(path.join(__dirname, modPath)).href);
    if (!mod.id || typeof mod.run !== "function") {
      throw new Error(`eval module missing id or run: ${modPath}`);
    }
    loaded.push(mod);
  }
  return loaded;
}

function isSkipped(outcome) {
  return Boolean(outcome && (outcome.status === "skipped" || outcome.skipped === true));
}

async function main() {
  const sha = readSha();
  const { opts, errors } = parseArgs(process.argv.slice(2));
  let checks = [];
  try {
    checks = await loadChecks();
  } catch (err) {
    if (errors.length || opts.help) {
      console.error(err);
    } else {
      throw err;
    }
  }
  const knownIds = checks.map((mod) => mod.id);

  if (errors.length) {
    const message = errors.join("; ");
    console.error(`evals: ${message}`);
    printUsage(knownIds);
    publish(
      buildSummary({
        ok: false,
        sha,
        error: "usage",
        message,
        knownIds,
      }),
      opts.out,
    );
    return 2;
  }

  if (opts.help) {
    printUsage(knownIds);
    publish(
      buildSummary({
        ok: true,
        sha,
        help: true,
        message: USAGE,
        knownIds,
      }),
      opts.out,
    );
    return 0;
  }

  if (opts.only && !knownIds.includes(opts.only)) {
    const message = `unknown check id: ${opts.only}`;
    console.error(`evals: ${message}`);
    console.error(`Checks: ${knownIds.join(", ")}`);
    publish(
      buildSummary({
        ok: false,
        sha,
        error: "usage",
        message,
        knownIds,
      }),
      opts.out,
    );
    return 2;
  }

  const selected = opts.only ? checks.filter((mod) => mod.id === opts.only) : checks;
  const ctx = { root, seedDir };
  const results = [];
  const skippedChecks = [];

  for (const mod of selected) {
    if (opts.skipBuild && mod.id === "build-smoke") {
      const reason = "--skip-build";
      skippedChecks.push({ id: mod.id, title: mod.title, status: "skipped", reason });
      console.error(`↷ skip ${mod.id} (${reason})`);
      continue;
    }

    process.stderr.write(`→ ${mod.id} — ${mod.title}\n`);
    let outcome;
    try {
      outcome = await Promise.resolve(mod.run(ctx));
    } catch (err) {
      outcome = { ok: false, message: String(err), details: { stack: err?.stack } };
    }

    if (isSkipped(outcome)) {
      const reason = outcome.reason || outcome.message || "skipped";
      skippedChecks.push({ id: mod.id, title: mod.title, status: "skipped", reason });
      console.error(`↷ skip ${mod.id} (${reason})`);
      continue;
    }

    const ok = Boolean(outcome?.ok);
    const row = {
      id: mod.id,
      title: mod.title,
      ok,
      status: ok ? "passed" : "failed",
      message: outcome?.message,
      details: outcome?.details,
    };
    results.push(row);
    console.error(`${ok ? "✓" : "✗"} ${mod.id}: ${row.message}`);
  }

  const failed = results.filter((row) => !row.ok);
  publish(
    buildSummary({
      ok: failed.length === 0,
      sha,
      results,
      skippedChecks,
    }),
    opts.out,
  );
  return failed.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    const summary = buildSummary({
      ok: false,
      error: "internal",
      message: String(err?.message || err),
    });
    console.log(JSON.stringify(summary, null, 2));
    console.error(err);
    process.exit(2);
  });
