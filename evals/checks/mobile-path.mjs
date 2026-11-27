import path from "node:path";
import { exists, fail, pass, readText, walkFiles } from "../lib/fs.mjs";

const REQUIRED_TOKEN_KEYS = [
  "canvas:",
  "ink:",
  "accent:",
  "quiet:",
];

export const id = "mobile-path";
export const title = "Expo mobile path seed + skills";

/**
 * Light smoke: filesystem contract for the named Expo path.
 * Does not run Expo install/build (store pipeline = Later).
 */
export function run(ctx) {
  const mobile = path.join(ctx.root, "examples", "mobile-seed");
  const docs = path.join(ctx.root, "docs", "mobile-path.md");
  const scaffoldSkill = path.join(ctx.root, "skills", "scaffold-mobile", "SKILL.md");
  const feelSkill = path.join(ctx.root, "skills", "mobile-feel", "SKILL.md");

  const requiredFiles = [
    path.join(mobile, "DESIGN.md"),
    path.join(mobile, "tokens.ts"),
    path.join(mobile, "App.tsx"),
    path.join(mobile, "package.json"),
    path.join(mobile, "app.json"),
    path.join(mobile, "components", "ui", "button.tsx"),
    path.join(mobile, "components", "ui", "stack.tsx"),
    docs,
    scaffoldSkill,
    feelSkill,
  ];

  const missing = requiredFiles.filter((p) => !exists(p));
  if (missing.length) {
    return fail("Mobile path files missing", {
      missing: missing.map((p) => path.relative(ctx.root, p)),
    });
  }

  const design = readText(path.join(mobile, "DESIGN.md"));
  for (const section of ["Surfaces", "Color", "Typography", "Components", "Touch"]) {
    if (!design.includes(`## ${section}`)) {
      return fail(`mobile DESIGN.md missing section: ${section}`);
    }
  }

  const tokens = readText(path.join(mobile, "tokens.ts"));
  const absent = REQUIRED_TOKEN_KEYS.filter((k) => !tokens.includes(k));
  if (absent.length) {
    return fail("tokens.ts missing required color keys", { absent });
  }
  // Shared palette with web-seed
  if (!tokens.includes("#0c7c72") || !tokens.includes("#e6eef3")) {
    return fail("tokens.ts should mirror web-seed accent/canvas hex values");
  }

  const app = readText(path.join(mobile, "App.tsx"));
  if (!/from ["'].*components\/ui/.test(app)) {
    return fail("App.tsx must import from components/ui (DS reuse)");
  }
  if (!/\bButton\b/.test(app)) {
    return fail("App.tsx should render the canonical Button");
  }
  if (/onPress=\{\(\)\s*=>\s*\{\s*\}\}/.test(app)) {
    return fail("example screen buttons must change visible state");
  }
  if (!/useState/.test(app)) {
    return fail("App.tsx must keep observable state for the example actions");
  }
  if (!/react-native-safe-area-context/.test(app)) {
    return fail("App.tsx must use react-native-safe-area-context for safe area");
  }
  if (/allowFontScaling=\{\s*false\s*\}/.test(app)) {
    return fail("example screen must allow enlarged text");
  }

  const button = readText(path.join(mobile, "components", "ui", "button.tsx"));
  if (!/pressed/.test(button) || !/android_ripple/.test(button)) {
    return fail("Button must expose press feedback (pressed style and android ripple)");
  }
  if (/allowFontScaling=\{\s*false\s*\}/.test(button)) {
    return fail("Button label must allow enlarged text");
  }

  const pkg = JSON.parse(readText(path.join(mobile, "package.json")));
  if (!pkg.dependencies?.expo) {
    return fail("mobile-seed package.json must depend on expo");
  }
  if (!pkg.dependencies?.["react-native"]) {
    return fail("mobile-seed package.json must depend on react-native");
  }
  if (!pkg.dependencies?.["react-native-safe-area-context"]) {
    return fail("mobile-seed must depend on react-native-safe-area-context");
  }

  const doc = readText(docs);
  if (!/Expo/i.test(doc) || !/Later/i.test(doc)) {
    return fail("docs/mobile-path.md must mention Expo and Later (store)");
  }
  if (!/App Store|Play/i.test(doc)) {
    return fail("docs/mobile-path.md must call out App Store/Play as Later");
  }

  // No rogue Button outside components/ui
  const tsxFiles = walkFiles(mobile, (f) => f.endsWith(".tsx") || f.endsWith(".jsx"));
  const rogueButtons = [];
  for (const file of tsxFiles) {
    const rel = path.relative(mobile, file);
    if (rel.startsWith(`components${path.sep}ui${path.sep}`)) continue;
    const src = readText(file);
    if (/export\s+function\s+Button\b/.test(src) || /export\s+const\s+Button\b/.test(src)) {
      rogueButtons.push(rel);
    }
  }
  if (rogueButtons.length) {
    return fail("Invented Button outside components/ui", { rogueButtons });
  }

  const ask = readText(path.join(ctx.root, "skills", "ask-desigma", "SKILL.md"));
  if (!/scaffold-mobile/.test(ask)) {
    return fail("ask-desigma must wire scaffold-mobile");
  }

  const pick = readText(path.join(ctx.root, "skills", "pick-stack", "SKILL.md"));
  if (!/scaffold-mobile/.test(pick)) {
    return fail("pick-stack must reference scaffold-mobile");
  }

  return pass("Mobile Expo path seed, docs, and skills present", {
    seed: "examples/mobile-seed",
    skills: ["scaffold-mobile", "mobile-feel"],
  });
}
