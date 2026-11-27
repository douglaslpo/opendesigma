import path from "node:path";
import { exists, fail, pass, readText, walkFiles } from "../lib/fs.mjs";

export const id = "ds-reuse";
export const title = "DS reuse (components/ui + tokens)";

export function run(ctx) {
  const seed = ctx.seedDir;
  const button = path.join(seed, "components", "ui", "button.tsx");
  const stack = path.join(seed, "components", "ui", "stack.tsx");
  const page = path.join(seed, "app", "page.tsx");

  if (!exists(button) || !exists(stack)) {
    return fail("Canonical UI primitives missing under components/ui", {
      button: exists(button),
      stack: exists(stack),
    });
  }

  if (!exists(page)) {
    return fail("app/page.tsx missing");
  }

  const pageSrc = readText(page);
  if (!/@\/components\/ui/.test(pageSrc) && !/from ["'].*components\/ui/.test(pageSrc)) {
    return fail("app/page.tsx must import from components/ui (DS reuse)");
  }
  if (!/\bButton\b/.test(pageSrc)) {
    return fail("app/page.tsx should render the canonical Button");
  }

  // Detect a second invented Button component outside components/ui.
  const tsxFiles = walkFiles(seed, (f) => f.endsWith(".tsx") || f.endsWith(".jsx"));
  const rogueButtons = [];
  for (const file of tsxFiles) {
    const rel = path.relative(seed, file);
    if (rel.startsWith(`components${path.sep}ui${path.sep}`)) continue;
    const src = readText(file);
    if (/export\s+function\s+Button\b/.test(src) || /export\s+const\s+Button\b/.test(src)) {
      rogueButtons.push(rel);
    }
  }
  if (rogueButtons.length) {
    return fail("Invented Button outside components/ui", { rogueButtons });
  }

  const buttonSrc = readText(button);
  const usesTokens =
    /--color-|--motion-|bg-accent|text-ink|var\(--/.test(buttonSrc);
  if (!usesTokens) {
    return fail("components/ui/button.tsx should consume design tokens / theme aliases");
  }

  // Rough reuse score: page references ui package + no rogue buttons.
  const score = {
    importsUi: true,
    usesCanonicalButton: true,
    rogueButtons: 0,
    buttonUsesTokens: usesTokens,
  };

  return pass("Page reuses components/ui; no rogue Button", { score });
}
