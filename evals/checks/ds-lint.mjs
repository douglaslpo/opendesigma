import path from "node:path";
import { pathToFileURL } from "node:url";
import { exists, fail, pass } from "../lib/fs.mjs";

export const id = "ds-lint";
export const title = "DS lint (tokens + invented components)";

export async function run(ctx) {
  const lintPath = path.join(ctx.root, "tools", "ds-lint", "ds-lint.mjs");
  const mod = await import(pathToFileURL(lintPath).href);
  const mobileTokens = path.join(ctx.root, "examples", "mobile-seed", "tokens.ts");
  const result = mod.lintSeed(ctx.seedDir, {
    mobileTokensPath: exists(mobileTokens) ? mobileTokens : undefined,
  });

  if (!result.ok) {
    const blockers = result.findings.filter((f) => f.severity === "blocker");
    return fail("DS lint blockers", {
      summary: result.summary,
      blockers,
    });
  }

  return pass("DS lint clean (no blockers)", {
    summary: result.summary,
    nits: result.findings.filter((f) => f.severity === "nit").map((f) => f.id),
    tokenDrifts: result.summary.tokenSemantics?.drifts?.length ?? null,
  });
}
