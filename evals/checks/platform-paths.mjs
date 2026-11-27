import path from "node:path";
import { fail, pass, readText } from "../lib/fs.mjs";

export const id = "platform-paths";
export const title = "Quickstart documents Unix and Windows paths";

export function run(ctx) {
  const quickstart = readText(path.join(ctx.root, "docs", "quickstart.md"));
  const overlay = readText(path.join(ctx.root, "harness-overlay", "README.md"));
  const required = [
    ["unix skill link", "ln -sfn"],
    ["unix mcp binary", "/target/debug/desigma-mcp"],
    ["windows mcp binary", "desigma-mcp.exe"],
    ["windows skill link", "SymbolicLink"],
    ["windows copy fallback", "Copy-Item"],
    ["windows workspace example", "C:\\\\src\\\\opendesigma"],
  ];
  const missing = required.filter(([, needle]) => !quickstart.includes(needle)).map(([name]) => name);
  if (missing.length) {
    return fail("quickstart is missing a platform path", { missing });
  }
  if (quickstart.includes("desigma-mcp.exe") && !quickstart.includes("target/debug/desigma-mcp\"")) {
    return fail("unix MCP example must name desigma-mcp without .exe");
  }
  if (!overlay.includes("SymbolicLink") || !overlay.includes("ln -sfn")) {
    return fail("harness overlay install must show Unix and Windows");
  }
  return pass("unix and windows paths", {
    unix: "target/debug/desigma-mcp",
    windows: "target/debug/desigma-mcp.exe",
  });
}
