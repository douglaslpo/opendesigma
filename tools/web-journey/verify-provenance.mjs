#!/usr/bin/env node
/**
 * Compare a provenance manifest with HEAD and the static artifact.
 * Exit 0 when the snapshot is still current. Exit 1 when it is unbound,
 * stale, or invalid. Exit 2 on usage errors.
 *
 *   node tools/web-journey/verify-provenance.mjs
 *   node tools/web-journey/verify-provenance.mjs --file path.json --sha <sha>
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hashArtifact, verifyProvenance } from "./provenance.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const artifactRoot = path.join(repoRoot, "fixtures", "web-journey", "static");
const defaultFile = path.join(artifactRoot, "provenance.json");

function readArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || "";
}

function readSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.trim()) return null;
  return result.stdout.trim();
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error("Usage: node tools/web-journey/verify-provenance.mjs [--file <manifest>] [--sha <sha>]");
    return 0;
  }
  const file = readArg(argv, "--file") || defaultFile;
  if (!fs.existsSync(file)) {
    console.error(`verify-provenance: file not found: ${file}`);
    return 2;
  }
  const head = readArg(argv, "--sha") || readSha();
  if (!head) {
    console.error("verify-provenance: could not read HEAD");
    return 2;
  }
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  const result = verifyProvenance(manifest, {
    head,
    artifactHash: hashArtifact(artifactRoot),
  });
  console.log(JSON.stringify({ ...result, sha: head, manifestSha: manifest.sha || null }, null, 2));
  return result.ok ? 0 : 1;
}

try {
  process.exit(main());
} catch (err) {
  console.error(err.message || err);
  process.exit(2);
}
