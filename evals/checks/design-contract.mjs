import path from "node:path";
import { exists, fail, pass, readText } from "../lib/fs.mjs";

const REQUIRED_TOKENS = [
  "--color-canvas",
  "--color-ink",
  "--color-accent",
  "--color-quiet",
  "--space-4",
  "--motion-fast",
];

export const id = "design-contract";
export const title = "DESIGN.md + tokens.css contract";

export function run(ctx) {
  const seed = ctx.seedDir;
  const designMd = path.join(seed, "DESIGN.md");
  const tokens = path.join(seed, "tokens.css");
  const globals = path.join(seed, "app", "globals.css");

  const missing = [designMd, tokens, globals].filter((p) => !exists(p));
  if (missing.length) {
    return fail("Missing design contract files", { missing });
  }

  const design = readText(designMd);
  for (const section of ["Surfaces", "Color", "Typography", "Components"]) {
    if (!design.includes(`## ${section}`)) {
      return fail(`DESIGN.md missing section: ${section}`);
    }
  }

  const tokenCss = readText(tokens);
  const absent = REQUIRED_TOKENS.filter((t) => !tokenCss.includes(t));
  if (absent.length) {
    return fail("tokens.css missing required variables", { absent });
  }

  const g = readText(globals);
  if (!/tokens\.css/.test(g)) {
    return fail("app/globals.css must import tokens.css");
  }

  return pass("Design contract files and tokens present", {
    tokensChecked: REQUIRED_TOKENS.length,
  });
}
