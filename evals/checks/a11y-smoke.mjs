import path from "node:path";
import { exists, fail, pass, readText } from "../lib/fs.mjs";

export const id = "a11y-smoke";
export const title = "A11y smoke (lang, button type, focus)";

export function run(ctx) {
  const layout = path.join(ctx.seedDir, "app", "layout.tsx");
  const button = path.join(ctx.seedDir, "components", "ui", "button.tsx");

  if (!exists(layout) || !exists(button)) {
    return fail("layout or Button missing for a11y smoke");
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

  return pass("Basic a11y smoke checks passed");
}
