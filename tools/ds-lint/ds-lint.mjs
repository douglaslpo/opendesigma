#!/usr/bin/env node
/**
 * OpenDesigma DS lint (light) — invalid token refs, invented components,
 * raw hex outside tokens.css. Default target: examples/web-seed.
 *
 * Usage:
 *   node tools/ds-lint/ds-lint.mjs [--root <path>] [--json]
 * Exit 0 = clean; 1 = findings; 2 = usage/IO error.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

/** Primitives that must live under components/ui when exported. */
const PROTECTED_EXPORTS = [
  "Button",
  "Card",
  "Modal",
  "Dialog",
  "Input",
  "Select",
  "Toast",
  "Dropdown",
  "Badge",
  "Avatar",
  "Tabs",
  "Tooltip",
  "Popover",
  "Drawer",
  "Checkbox",
  "Switch",
  "TextField",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".git",
]);

function parseArgs(argv) {
  const opts = { root: path.join(REPO_ROOT, "examples", "web-seed"), json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") opts.root = path.resolve(argv[++i]);
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
  }
  return opts;
}

function walkFiles(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkFiles(full, pred, acc);
    } else if (pred(full)) {
      acc.push(full);
    }
  }
  return acc;
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Collect --token-name definitions from CSS (and :root blocks). */
function collectDefinedTokens(cssText) {
  const defined = new Set();
  const re = /(--[a-zA-Z0-9-_]+)\s*:/g;
  let m;
  while ((m = re.exec(cssText))) defined.add(m[1]);
  return defined;
}

/** var(--token) and var(--token, fallback) usages. */
function collectTokenUsages(text) {
  const usages = [];
  const re = /var\(\s*(--[a-zA-Z0-9-_]+)/g;
  let m;
  while ((m = re.exec(text))) {
    usages.push({ name: m[1], index: m.index });
  }
  return usages;
}

function lineAt(src, index) {
  return src.slice(0, index).split(/\r?\n/).length;
}

function loadRegistryExports(seedDir) {
  const registryPath = path.join(seedDir, "code-connect", "registry.json");
  if (!fs.existsSync(registryPath)) return { path: registryPath, exports: [] };
  try {
    const data = JSON.parse(readText(registryPath));
    const exports = (data.components || [])
      .map((c) => c.export)
      .filter(Boolean);
    return { path: registryPath, exports };
  } catch (err) {
    return { path: registryPath, exports: [], error: String(err) };
  }
}

function listUiExports(seedDir) {
  const uiDir = path.join(seedDir, "components", "ui");
  const found = new Set();
  if (!fs.existsSync(uiDir)) return found;
  for (const file of walkFiles(uiDir, (f) => /\.(tsx|jsx|ts|js)$/.test(f))) {
    if (/\.figma\./.test(file)) continue;
    const src = readText(file);
    const re =
      /export\s+(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)\b|export\s+\{\s*([^}]+)\s*\}/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) found.add(m[1]);
      if (m[2]) {
        for (const part of m[2].split(",")) {
          const name = part
            .trim()
            .split(/\s+as\s+/)
            .pop()
            .trim();
          if (/^[A-Z][A-Za-z0-9]*$/.test(name)) found.add(name);
        }
      }
    }
  }
  return found;
}

/**
 * Run lint against a seed directory. Pure function for evals + CLI.
 * @returns {{ ok: boolean, findings: object[], summary: object }}
 */
export function lintSeed(seedDir) {
  const findings = [];
  const tokensPath = path.join(seedDir, "tokens.css");
  const globalsPath = path.join(seedDir, "app", "globals.css");

  if (!fs.existsSync(tokensPath)) {
    findings.push({
      id: "tokens-missing",
      severity: "blocker",
      message: "tokens.css missing",
      file: path.relative(seedDir, tokensPath) || "tokens.css",
    });
    return summarize(findings, seedDir);
  }

  const tokensCss = readText(tokensPath);
  const defined = collectDefinedTokens(tokensCss);

  // Merge tokens from globals if it defines more (theme bridges).
  if (fs.existsSync(globalsPath)) {
    for (const t of collectDefinedTokens(readText(globalsPath))) defined.add(t);
  }

  // Always allow recursive / known CSS-wide vars that may appear without local def.
  const allowUndefined = new Set([
    "--font-fraunces",
    "--font-source-sans",
    "--font-source-code",
  ]);

  const scanFiles = walkFiles(
    seedDir,
    (f) => /\.(tsx|jsx|ts|js|css)$/.test(f) && !f.endsWith("tokens.css"),
  );

  for (const file of scanFiles) {
    const rel = path.relative(seedDir, file);
    const raw = readText(file);
    const src = stripComments(raw);

    for (const usage of collectTokenUsages(src)) {
      if (defined.has(usage.name) || allowUndefined.has(usage.name)) continue;
      // Tailwind / Next font vars injected at runtime — allow --font-* if next/font pattern.
      if (usage.name.startsWith("--font-")) continue;
      findings.push({
        id: "invalid-token",
        severity: "blocker",
        message: `Unknown token ${usage.name}`,
        file: rel,
        line: lineAt(raw, usage.index),
        token: usage.name,
      });
    }

    // Raw hex outside tokens.css (allow in comments already stripped).
    // Skip data URIs / hash fragments roughly by requiring # + 3/6/8 hex.
    const hexRe = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    let hm;
    while ((hm = hexRe.exec(src))) {
      // Ignore Tailwind arbitrary opacity separators already matched; ignore if inside url(#id)
      const before = src.slice(Math.max(0, hm.index - 4), hm.index);
      if (/url\($/.test(before.trimEnd()) || before.endsWith("url(")) continue;
      findings.push({
        id: "raw-hex",
        severity: "nit",
        message: `Raw hex ${hm[0]} — prefer tokens.css when a token exists`,
        file: rel,
        line: lineAt(raw, hm.index),
        value: hm[0],
      });
    }
  }

  // Invented protected components outside components/ui.
  const tsxFiles = walkFiles(seedDir, (f) => /\.(tsx|jsx)$/.test(f));
  const uiPrefix = `components${path.sep}ui${path.sep}`;
  for (const file of tsxFiles) {
    const rel = path.relative(seedDir, file);
    if (rel.startsWith(uiPrefix)) continue;
    if (/\.figma\./.test(rel)) continue;
    const src = stripComments(readText(file));
    for (const name of PROTECTED_EXPORTS) {
      const re = new RegExp(
        String.raw`export\s+(?:async\s+)?(?:function|const|class)\s+${name}\b`,
      );
      if (re.test(src)) {
        findings.push({
          id: "invented-component",
          severity: "blocker",
          message: `Invented ${name} outside components/ui`,
          file: rel,
          component: name,
        });
      }
    }
  }

  // Registry ↔ filesystem consistency.
  const registry = loadRegistryExports(seedDir);
  if (registry.error) {
    findings.push({
      id: "registry-parse",
      severity: "blocker",
      message: `registry.json parse error: ${registry.error}`,
      file: path.relative(seedDir, registry.path),
    });
  } else if (registry.exports.length) {
    const uiExports = listUiExports(seedDir);
    for (const name of registry.exports) {
      if (!uiExports.has(name)) {
        findings.push({
          id: "registry-missing-export",
          severity: "blocker",
          message: `registry lists ${name} but components/ui does not export it`,
          component: name,
          file: path.relative(seedDir, registry.path),
        });
      }
    }
  } else if (!fs.existsSync(registry.path)) {
    findings.push({
      id: "registry-missing",
      severity: "should",
      message: "code-connect/registry.json missing — agents lack component SoT",
      file: "code-connect/registry.json",
    });
  }

  return summarize(findings, seedDir, defined.size);
}

function summarize(findings, seedDir, tokenCount = 0) {
  const blockers = findings.filter((f) => f.severity === "blocker");
  const shoulds = findings.filter((f) => f.severity === "should");
  const nits = findings.filter((f) => f.severity === "nit");
  // Exit/ok fails on blockers only. "should" and "nit" stay visible for Design Jury.
  return {
    ok: blockers.length === 0,
    seedDir,
    findings,
    summary: {
      blockers: blockers.length,
      should: shoulds.length,
      nits: nits.length,
      total: findings.length,
      tokensDefined: tokenCount,
    },
  };
}

function printHuman(result) {
  const { findings, summary, seedDir } = result;
  console.error(`ds-lint · ${seedDir}`);
  console.error(
    `tokens=${summary.tokensDefined}  findings=${summary.total} (blockers=${summary.blockers}, should=${summary.should}, nits=${summary.nits})`,
  );
  for (const f of findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file || "";
    console.error(`  [${f.severity}] ${f.id} ${loc} — ${f.message}`);
  }
  if (!findings.length) console.error("  clean");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(`Usage: node tools/ds-lint/ds-lint.mjs [--root <path>] [--json]`);
    process.exit(0);
  }
  if (!fs.existsSync(opts.root)) {
    console.error(`ds-lint: root not found: ${opts.root}`);
    process.exit(2);
  }

  const result = lintSeed(opts.root);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
    console.log(
      JSON.stringify({
        ok: result.ok,
        summary: result.summary,
        findingIds: result.findings.map((f) => f.id),
      }),
    );
  }
  process.exit(result.ok ? 0 : 1);
}

const isDirect =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirect) {
  main();
}
