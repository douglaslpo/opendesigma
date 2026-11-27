import path from "node:path";
import { exists, fail, pass, readText } from "../lib/fs.mjs";

const REQUIRED_IDS = [
  "/vercel/next.js",
  "/reactjs/react.dev",
  "/tailwindlabs/tailwindcss",
];

export const id = "context7-map";
export const title = "Context7 stack map pinned";

export function run(ctx) {
  const jsonPath = path.join(ctx.root, "context7.json");
  const mdPath = path.join(ctx.root, "docs", "context7-stack.md");

  if (!exists(jsonPath)) {
    return fail("context7.json missing at repo root");
  }
  if (!exists(mdPath)) {
    return fail("docs/context7-stack.md missing");
  }

  let data;
  try {
    data = JSON.parse(readText(jsonPath));
  } catch (err) {
    return fail("context7.json is not valid JSON", { error: String(err) });
  }

  const ids = (data.libraries || []).map((l) => l.id);
  const missing = REQUIRED_IDS.filter((id) => !ids.includes(id));
  if (missing.length) {
    return fail("context7.json missing required library IDs", { missing, ids });
  }

  const requiredFlag = (data.libraries || []).filter((l) => l.required);
  if (requiredFlag.length < 3) {
    return fail("Expected at least 3 required libraries in context7.json", {
      requiredFlag: requiredFlag.map((l) => l.id),
    });
  }

  const md = readText(mdPath);
  for (const id of REQUIRED_IDS) {
    if (!md.includes(id)) {
      return fail(`docs/context7-stack.md missing ID ${id}`);
    }
  }

  return pass("Context7 map lists required stack IDs", {
    libraries: ids.length,
  });
}
