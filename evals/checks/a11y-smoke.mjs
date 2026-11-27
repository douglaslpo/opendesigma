import path from "node:path";
import { exists, fail, pass, readText } from "../lib/fs.mjs";

export const id = "a11y-smoke";
export const title = "A11y smoke (lang, button type, focus)";

export function run(ctx) {
  const layout = path.join(ctx.seedDir, "app", "layout.tsx");
  const button = path.join(ctx.seedDir, "components", "ui", "button.tsx");
  const globals = path.join(ctx.seedDir, "app", "globals.css");

  if (!exists(layout) || !exists(button) || !exists(globals)) {
    return fail("layout, Button, or globals.css missing for a11y smoke");
  }

  const layoutSrc = readText(layout);
  if (!/lang=["']en["']/.test(layoutSrc) && !/lang=\{/.test(layoutSrc)) {
    return fail('<html> should set lang (e.g. lang="en")');
  }

  const buttonSrc = readText(button);
  if (!/type\s*=\s*["']button["']/.test(buttonSrc) && !/type\s*=\s*type/.test(buttonSrc)) {
    return fail("Button should default type to \"button\" (avoid accidental submit)");
  }
  if (!/focus-visible/.test(buttonSrc)) {
    return fail("Button should include focus-visible styles");
  }

  const globalsSrc = readText(globals);
  if (!/prefers-reduced-motion/.test(globalsSrc)) {
    return fail("globals.css should honor prefers-reduced-motion");
  }

  return pass("Source a11y smoke passed (not a browser pass)", {
    layer: "source",
    browser: "node tools/ds-jury/run.mjs --browser",
  });
}
