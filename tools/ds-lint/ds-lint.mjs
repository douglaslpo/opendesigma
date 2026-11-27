#!/usr/bin/env node
/**
 * OpenDesigma DS lint (light) — invalid token refs, invented components,
 * raw hex outside tokens.css, registry path+export, web/mobile token semantics.
 * Default target: examples/web-seed.
 *
 * Usage:
 *   node tools/ds-lint/ds-lint.mjs [--root <path>] [--json] [--skip-mobile] [--mobile <path>]
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

/**
 * Documented platform exceptions. Shared color, space, and motion values
 * still have to match. These rows are not compared as drift.
 * Canonical values live in examples/web-seed/tokens.css.
 */
export const NATIVE_DIVERGENCES = [
  {
    id: "type-faces",
    web: "--font-display, --font-sans, --font-mono",
    native: "type.display, type.sans, type.mono",
    reason:
      "Web loads Fraunces, Source Sans 3, and Source Code Pro. React Native keeps System and Courier until a face is bundled.",
  },
  {
    id: "ease-curve",
    web: "--ease-out",
    native: null,
    reason:
      "The cubic-bezier stays in CSS. The mobile seed uses press opacity and does not copy the curve.",
  },
  {
    id: "space-unit",
    web: "rem (compared at a 16px root)",
    native: "px",
    reason:
      "The scale is the same numbers. The unit is the platform form, not a second spacing system.",
  },
  {
    id: "button-padding",
    web: "px-5 (20px)",
    native: "space[4] + space[1] (20)",
    reason:
      "Same 20px horizontal padding. Web uses a Tailwind step between space-4 and space-6; native adds those two tokens.",
  },
];

const MOTION_KEYS = {
  fast: "fastMs",
  med: "medMs",
};

function parseArgs(argv) {
  const opts = {
    root: path.join(REPO_ROOT, "examples", "web-seed"),
    json: false,
    skipMobile: false,
    mobile: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") opts.root = path.resolve(argv[++i] ?? "");
    else if (a === "--json") opts.json = true;
    else if (a === "--skip-mobile") opts.skipMobile = true;
    else if (a === "--mobile") opts.mobile = path.resolve(argv[++i] ?? "");
    else if (a === "--help" || a === "-h") opts.help = true;
    else opts.unknown = a;
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

function resolveInside(root, rel) {
  if (!rel || typeof rel !== "string" || path.isAbsolute(rel)) return null;
  const abs = path.resolve(root, rel);
  const base = path.resolve(root);
  if (abs !== base && !abs.startsWith(base + path.sep)) return null;
  return abs;
}

function exportsInSource(src) {
  const found = new Set();
  const clean = stripComments(src);
  const re =
    /export\s+(?:async\s+)?(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)\b|export\s+(?:type\s+)?\{\s*([^}]+)\s*\}/g;
  let m;
  while ((m = re.exec(clean))) {
    if (m[1]) found.add(m[1]);
    if (m[2]) {
      for (const part of m[2].split(",")) {
        const name = part
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .pop()
          .trim();
        if (/^[A-Z][A-Za-z0-9]*$/.test(name)) found.add(name);
      }
    }
  }
  return found;
}

function loadRegistry(seedDir) {
  const registryPath = path.join(seedDir, "code-connect", "registry.json");
  if (!fs.existsSync(registryPath)) {
    return { path: registryPath, exists: false, components: [], meta: {} };
  }
  try {
    const data = JSON.parse(readText(registryPath));
    return {
      path: registryPath,
      exists: true,
      components: Array.isArray(data.components) ? data.components : [],
      meta: data,
    };
  } catch (err) {
    return {
      path: registryPath,
      exists: true,
      components: [],
      meta: {},
      error: String(err),
    };
  }
}

function barrelExports(seedDir) {
  const uiDir = path.join(seedDir, "components", "ui");
  const found = new Set();
  for (const ext of ["ts", "tsx", "js", "jsx"]) {
    const indexPath = path.join(uiDir, `index.${ext}`);
    if (!fs.existsSync(indexPath)) continue;
    for (const name of exportsInSource(readText(indexPath))) found.add(name);
  }
  return found;
}

function cssCustomProps(cssText) {
  const out = {};
  const re = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  const clean = stripComments(cssText);
  let m;
  while ((m = re.exec(clean))) out[m[1]] = m[2].trim();
  return out;
}

function parseTsObject(src, exportName) {
  const re = new RegExp(
    `export const ${exportName} = \\{([\\s\\S]*?)\\}\\s*(?:as\\s+const\\s*)?;`,
  );
  const m = src.match(re);
  if (!m) return null;
  const out = {};
  const prop = /([A-Za-z0-9_]+)\s*:\s*("[^"]*"|'[^']*'|-?\d+(?:\.\d+)?)/g;
  let p;
  while ((p = prop.exec(m[1]))) {
    let value = p[2];
    if (value.startsWith('"') || value.startsWith("'")) value = value.slice(1, -1);
    else value = Number(value);
    out[p[1]] = value;
  }
  return out;
}

function kebabToCamel(value) {
  return value.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeHex(value) {
  const raw = String(value).trim().toLowerCase();
  const m = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (!m) return raw;
  const hex = m[1];
  if (hex.length === 3 || hex.length === 4) {
    return `#${hex
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  return `#${hex}`;
}

function toPx(value) {
  const raw = String(value).trim().toLowerCase();
  if (raw.endsWith("rem")) return Number.parseFloat(raw) * 16;
  if (raw.endsWith("px")) return Number.parseFloat(raw);
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function sameNumber(a, b) {
  return a != null && b != null && Math.abs(a - b) < 0.01;
}

/**
 * Compare web tokens.css semantics to mobile tokens.ts.
 * Canonical source is the CSS file. Native divergences are listed, not failed.
 * @returns {{ drifts: object[], divergences: object[], matched: string[] }}
 */
export function compareTokenSemantics(cssText, tsText) {
  const drifts = [];
  const matched = [];
  const css = cssCustomProps(cssText);
  const color = parseTsObject(tsText, "color");
  const space = parseTsObject(tsText, "space");
  const motion = parseTsObject(tsText, "motion");

  if (!color || !space || !motion) {
    drifts.push({
      id: "token-mirror-parse",
      key: "tokens.ts",
      message: "mobile tokens.ts is missing color, space, or motion",
    });
    return { drifts, divergences: NATIVE_DIVERGENCES, matched };
  }

  const cssColors = Object.keys(css)
    .filter((name) => name.startsWith("--color-"))
    .map((name) => name.slice("--color-".length));
  const mobileColors = Object.keys(color);
  const colorKeys = new Set([
    ...cssColors.map(kebabToCamel),
    ...mobileColors,
  ]);
  for (const key of [...colorKeys].sort()) {
    const cssName = `--color-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    const cssValue = css[cssName];
    const mobileValue = color[key];
    if (cssValue == null || mobileValue == null) {
      drifts.push({
        id: "token-drift",
        key: `color.${key}`,
        web: cssValue ?? null,
        native: mobileValue ?? null,
        message: `color.${key} is missing on one side`,
      });
      continue;
    }
    if (normalizeHex(cssValue) !== normalizeHex(mobileValue)) {
      drifts.push({
        id: "token-drift",
        key: `color.${key}`,
        web: cssValue,
        native: mobileValue,
        message: `color.${key} differs`,
      });
      continue;
    }
    matched.push(`color.${key}`);
  }

  const cssSpace = Object.keys(css)
    .filter((name) => name.startsWith("--space-"))
    .map((name) => name.slice("--space-".length));
  const spaceKeys = new Set([...cssSpace, ...Object.keys(space)]);
  for (const key of [...spaceKeys].sort()) {
    const cssValue = css[`--space-${key}`];
    const mobileValue = space[key];
    const webPx = cssValue == null ? null : toPx(cssValue);
    const nativePx = mobileValue == null ? null : toPx(mobileValue);
    if (!sameNumber(webPx, nativePx)) {
      drifts.push({
        id: "token-drift",
        key: `space.${key}`,
        web: cssValue ?? null,
        native: mobileValue ?? null,
        message: `space.${key} differs after rem→px`,
      });
      continue;
    }
    matched.push(`space.${key}`);
  }

  const cssMotion = Object.keys(css)
    .filter((name) => name.startsWith("--motion-"))
    .map((name) => name.slice("--motion-".length));
  const motionKeys = new Set([
    ...cssMotion,
    ...Object.keys(motion).map((key) =>
      key.endsWith("Ms") ? key.slice(0, -2) : key,
    ),
  ]);
  for (const key of [...motionKeys].sort()) {
    const nativeKey = MOTION_KEYS[key] || key;
    const cssValue = css[`--motion-${key}`];
    const mobileValue = motion[nativeKey];
    const webMs = cssValue == null ? null : Number.parseFloat(cssValue);
    const nativeMs = mobileValue == null ? null : Number(mobileValue);
    if (!sameNumber(webMs, nativeMs)) {
      drifts.push({
        id: "token-drift",
        key: `motion.${key}`,
        web: cssValue ?? null,
        native: mobileValue ?? null,
        message: `motion.${key} differs`,
      });
      continue;
    }
    matched.push(`motion.${key}`);
  }

  return { drifts, divergences: NATIVE_DIVERGENCES, matched };
}

function classifyFigmaStatus(component, templateText) {
  const url = component?.figmaUrl;
  const realUrl =
    typeof url === "string" &&
    /^https?:\/\//.test(url) &&
    !url.includes("REPLACE_WITH");
  if (realUrl) return "linked";
  if (component?.template || /REPLACE_WITH_FIGMA_URL/.test(templateText || "")) {
    return "stub";
  }
  return "unmapped";
}

/**
 * Status of each Figma mapping. `published` stays false unless a publish
 * log is passed in — a template or a URL is not a publish.
 */
export function figmaMappingReport(webSeed, mobileSeed = null) {
  const rows = [];
  const registry = loadRegistry(webSeed);
  if (registry.exists && !registry.error) {
    for (const component of registry.components) {
      const templateAbs = component.template
        ? resolveInside(webSeed, component.template)
        : null;
      const templateText =
        templateAbs && fs.existsSync(templateAbs) ? readText(templateAbs) : "";
      rows.push({
        surface: "web",
        id: component.id ?? null,
        export: component.export ?? null,
        source: component.source ?? null,
        template: component.template ?? null,
        figmaUrl: component.figmaUrl ?? null,
        status: classifyFigmaStatus(component, templateText),
        published: false,
        publishEvidence: null,
      });
    }
  }

  if (mobileSeed && fs.existsSync(mobileSeed)) {
    const mobileRegistry = path.join(mobileSeed, "code-connect", "registry.json");
    if (!fs.existsSync(mobileRegistry)) {
      const uiDir = path.join(mobileSeed, "components", "ui");
      const files = walkFiles(uiDir, (f) => /\.(tsx|jsx)$/.test(f) && !/\.figma\./.test(f));
      for (const file of files) {
        for (const name of exportsInSource(readText(file))) {
          rows.push({
            surface: "mobile",
            id: name.toLowerCase(),
            export: name,
            source: path.relative(mobileSeed, file).split(path.sep).join("/"),
            template: null,
            figmaUrl: null,
            status: "unmapped",
            published: false,
            publishEvidence: null,
            note: "No code-connect/registry.json on the mobile seed",
          });
        }
      }
    }
  }

  return {
    rows,
    stub: rows.filter((row) => row.status === "stub").length,
    linked: rows.filter((row) => row.status === "linked").length,
    unmapped: rows.filter((row) => row.status === "unmapped").length,
    published: 0,
  };
}

function checkRegistry(seedDir, findings) {
  const registry = loadRegistry(seedDir);
  const relRegistry = path.relative(seedDir, registry.path);
  if (registry.error) {
    findings.push({
      id: "registry-parse",
      severity: "blocker",
      message: `registry.json parse error: ${registry.error}`,
      file: relRegistry,
    });
    return;
  }
  if (!registry.exists) {
    findings.push({
      id: "registry-missing",
      severity: "should",
      message: "code-connect/registry.json missing — agents lack component SoT",
      file: "code-connect/registry.json",
    });
    return;
  }

  for (const field of ["designMd", "tokens"]) {
    const rel = registry.meta?.[field];
    if (typeof rel !== "string" || !rel) continue;
    const abs = resolveInside(seedDir, rel);
    if (!abs || !fs.existsSync(abs)) {
      findings.push({
        id: "registry-missing-path",
        severity: "should",
        message: `registry ${field} path does not exist: ${rel}`,
        file: relRegistry,
      });
    }
  }

  const barrel = barrelExports(seedDir);
  for (const component of registry.components) {
    const name = component.export;
    const sourceRel = component.source;
    if (!name || !sourceRel) {
      findings.push({
        id: "registry-missing-export",
        severity: "blocker",
        message: "registry component is missing export or source",
        file: relRegistry,
        component: name,
      });
      continue;
    }

    const sourceAbs = resolveInside(seedDir, sourceRel);
    if (!sourceAbs || !fs.existsSync(sourceAbs)) {
      findings.push({
        id: "registry-missing-path",
        severity: "blocker",
        message: `registry source for ${name} does not exist: ${sourceRel}`,
        file: relRegistry,
        component: name,
      });
      continue;
    }

    const exported = exportsInSource(readText(sourceAbs));
    if (!exported.has(name)) {
      findings.push({
        id: "registry-missing-export",
        severity: "blocker",
        message: `registry lists ${name} at ${sourceRel} but that file does not export it`,
        file: sourceRel,
        component: name,
      });
    }

    const importText = component.import || "";
    if (importText && !importText.includes(name)) {
      findings.push({
        id: "registry-import-mismatch",
        severity: "blocker",
        message: `registry import for ${name} does not mention that export`,
        file: relRegistry,
        component: name,
      });
    }
    const targetsBarrel =
      /components\/ui["']/.test(importText) || /@\/components\/ui["']/.test(importText);
    if (targetsBarrel && !barrel.has(name)) {
      findings.push({
        id: "registry-barrel-missing",
        severity: "blocker",
        message: `registry import for ${name} targets components/ui but the barrel does not export it`,
        file: path.join("components", "ui", "index.ts"),
        component: name,
      });
    }

    if (component.template) {
      const templateAbs = resolveInside(seedDir, component.template);
      if (!templateAbs || !fs.existsSync(templateAbs)) {
        findings.push({
          id: "registry-missing-template",
          severity: "blocker",
          message: `registry template for ${name} does not exist: ${component.template}`,
          file: relRegistry,
          component: name,
        });
      } else {
        const template = readText(templateAbs);
        const marked = template.match(/component\s*=\s*([A-Za-z0-9_]+)/);
        if (marked && marked[1] !== name) {
          findings.push({
            id: "registry-template-mismatch",
            severity: "should",
            message: `template component=${marked[1]} does not match export ${name}`,
            file: component.template,
            component: name,
          });
        }
      }
    }
  }
}

/**
 * Run lint against a seed directory. Pure function for evals + CLI.
 * `mobileTokensPath` compares that file to this seed's tokens.css.
 * @returns {{ ok: boolean, findings: object[], summary: object }}
 */
export function lintSeed(seedDir, options = {}) {
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

  if (fs.existsSync(globalsPath)) {
    for (const t of collectDefinedTokens(readText(globalsPath))) defined.add(t);
  }

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

    const hexRe = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
    let hm;
    while ((hm = hexRe.exec(src))) {
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

  checkRegistry(seedDir, findings);

  let tokenSemantics = { skipped: true, reason: "mobile mirror not requested" };
  if (options.mobileTokensPath) {
    if (!fs.existsSync(options.mobileTokensPath)) {
      findings.push({
        id: "token-mirror-missing",
        severity: "blocker",
        message: `mobile token mirror not found: ${options.mobileTokensPath}`,
        file: "tokens.ts",
      });
      tokenSemantics = { skipped: false, drifts: [], divergences: NATIVE_DIVERGENCES, matched: [] };
    } else {
      tokenSemantics = compareTokenSemantics(tokensCss, readText(options.mobileTokensPath));
      tokenSemantics.skipped = false;
      tokenSemantics.canonical = path.relative(REPO_ROOT, tokensPath) || tokensPath;
      for (const drift of tokenSemantics.drifts) {
        findings.push({
          id: "token-drift",
          severity: "blocker",
          message: drift.message,
          file: "tokens.css",
          token: drift.key,
          web: drift.web,
          native: drift.native,
        });
      }
    }
  }

  return summarize(findings, seedDir, defined.size, tokenSemantics);
}

function summarize(findings, seedDir, tokenCount = 0, tokenSemantics = null) {
  const blockers = findings.filter((f) => f.severity === "blocker");
  const shoulds = findings.filter((f) => f.severity === "should");
  const nits = findings.filter((f) => f.severity === "nit");
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
      tokenSemantics,
    },
  };
}

function printHuman(result, figma) {
  const { findings, summary, seedDir } = result;
  console.error(`ds-lint · ${seedDir}`);
  console.error(
    `tokens=${summary.tokensDefined}  findings=${summary.total} (blockers=${summary.blockers}, should=${summary.should}, nits=${summary.nits})`,
  );
  const semantics = summary.tokenSemantics;
  if (semantics && !semantics.skipped) {
    console.error(
      `token semantics matched=${semantics.matched?.length ?? 0} drifts=${semantics.drifts?.length ?? 0} canonical=${semantics.canonical || "tokens.css"}`,
    );
    for (const row of semantics.divergences || []) {
      console.error(`  [divergence] ${row.id} — ${row.reason}`);
    }
  }
  if (figma) {
    for (const row of figma.rows) {
      console.error(
        `  [figma] ${row.surface} ${row.id} ${row.status} published=${row.published}`,
      );
    }
  }
  for (const f of findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file || "";
    console.error(`  [${f.severity}] ${f.id} ${loc} — ${f.message}`);
  }
  if (!findings.length) console.error("  clean");
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(
      "Usage: node tools/ds-lint/ds-lint.mjs [--root <path>] [--json] [--skip-mobile] [--mobile <path>]",
    );
    process.exit(0);
  }
  if (opts.unknown) {
    console.error(`ds-lint: unknown option: ${opts.unknown}`);
    process.exit(2);
  }
  if (!fs.existsSync(opts.root)) {
    console.error(`ds-lint: root not found: ${opts.root}`);
    process.exit(2);
  }

  const mobileDefault = path.join(opts.root, "..", "mobile-seed", "tokens.ts");
  const mobileTokensPath = opts.skipMobile
    ? undefined
    : opts.mobile || (fs.existsSync(mobileDefault) ? mobileDefault : undefined);

  const result = lintSeed(opts.root, { mobileTokensPath });
  const figma = figmaMappingReport(
    opts.root,
    mobileTokensPath ? path.dirname(mobileTokensPath) : path.join(opts.root, "..", "mobile-seed"),
  );
  if (opts.json) {
    console.log(JSON.stringify({ ...result, figma }, null, 2));
  } else {
    printHuman(result, figma);
    console.log(
      JSON.stringify({
        ok: result.ok,
        summary: result.summary,
        findingIds: result.findings.map((f) => f.id),
        figma: figma.rows.map((row) => ({
          surface: row.surface,
          id: row.id,
          status: row.status,
          published: row.published,
        })),
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
