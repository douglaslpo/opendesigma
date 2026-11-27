#!/usr/bin/env node
/**
 * OpenDesigma MVP eval runner.
 * Usage: node evals/run.mjs [--skip-build] [--only <id>]
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  "./checks/router-decisions.mjs",
  "./checks/harness-overlay.mjs",
  "./checks/platform-paths.mjs",
  "./checks/build-smoke.mjs",
];

function parseArgs(argv) {
  const opts = { skipBuild: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skip-build") opts.skipBuild = true;
    else if (a === "--only") opts.only = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const ctx = { root, seedDir };
  const results = [];

  for (const modPath of CHECK_MODULES) {
    const mod = await import(pathToFileURL(path.join(__dirname, modPath)).href);
    if (opts.only && mod.id !== opts.only) continue;
    if (opts.skipBuild && mod.id === "build-smoke") {
      console.error(`↷ skip ${mod.id} (--skip-build)`);
      continue;
    }

    process.stderr.write(`→ ${mod.id} — ${mod.title}\n`);
    let outcome;
    try {
      outcome = await Promise.resolve(mod.run(ctx));
    } catch (err) {
      outcome = { ok: false, message: String(err), details: { stack: err?.stack } };
    }
    const row = { id: mod.id, title: mod.title, ...outcome };
    results.push(row);
    console.error(`${outcome.ok ? "✓" : "✗"} ${mod.id}: ${outcome.message}`);
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    ok: failed.length === 0,
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    total: results.length,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
