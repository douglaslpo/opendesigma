import { spawnSync } from "node:child_process";
import path from "node:path";
import { exists, fail, pass } from "../lib/fs.mjs";

export const id = "build-smoke";
export const title = "Next.js production build smoke";

export function run(ctx) {
  const seed = ctx.seedDir;
  const pkg = path.join(seed, "package.json");
  if (!exists(pkg)) {
    return fail("examples/web-seed/package.json missing");
  }

  const nodeModules = path.join(seed, "node_modules");
  if (!exists(nodeModules)) {
    return fail(
      "examples/web-seed/node_modules missing — run: cd examples/web-seed && pnpm install",
    );
  }

  const result = spawnSync("pnpm", ["build"], {
    cwd: seed,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    timeout: 180_000,
  });

  if (result.status !== 0) {
    return fail("pnpm build failed", {
      status: result.status,
      stderr: (result.stderr || "").slice(-2000),
      stdout: (result.stdout || "").slice(-2000),
    });
  }

  return pass("pnpm build succeeded", {
    stdoutTail: (result.stdout || "").split("\n").slice(-8).join("\n"),
  });
}
