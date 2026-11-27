import fs from "node:fs";
import path from "node:path";

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function exists(filePath) {
  return fs.existsSync(filePath);
}

export function walkFiles(dir, pred = () => true, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walkFiles(full, pred, acc);
    } else if (pred(full)) {
      acc.push(full);
    }
  }
  return acc;
}

export function fail(message, details = {}) {
  return { ok: false, message, details };
}

export function pass(message, details = {}) {
  return { ok: true, message, details };
}
