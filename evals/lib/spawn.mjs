import { spawnSync } from "node:child_process";

/**
 * Run pnpm. On Windows the pnpm shim is `pnpm.cmd`, and Node fails with
 * ENOENT unless `shell` is set. Arguments stay an array on every platform.
 */
export function runPnpm(args, options = {}) {
  return spawnSync("pnpm", args, {
    ...options,
    shell: process.platform === "win32",
  });
}
