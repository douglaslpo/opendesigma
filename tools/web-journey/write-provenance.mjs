#!/usr/bin/env node
/**
 * Bind fixtures/web-journey/static/provenance.json to the current HEAD.
 * The file is not part of the artifact hash. The next commit invalidates it.
 *
 * Usage:
 *   node tools/web-journey/write-provenance.mjs --gates <file> \
 *     --local-static http://127.0.0.1:4173/ \
 *     --local-next http://127.0.0.1:3000/briefing
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ARTIFACT_FILES, buildManifest, hashArtifact } from "./provenance.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const artifactRoot = path.join(repoRoot, "fixtures", "web-journey", "static");
const defaultOut = path.join(artifactRoot, "provenance.json");

function usage() {
  console.error(
    "Usage: node tools/web-journey/write-provenance.mjs [--gates <file>] [--local-static <url>] [--local-next <url>] [--deployed <url>] [--out <file>] [--sha <sha>]",
  );
}

function readArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) return "";
  return value;
}

function readSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error("git rev-parse HEAD failed");
  }
  return result.stdout.trim();
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    return 0;
  }
  const gatesPath = readArg(argv, "--gates");
  const outPath = readArg(argv, "--out") || defaultOut;
  let gates = [];
  if (gatesPath) {
    if (!gatesPath || !fs.existsSync(gatesPath)) {
      console.error("write-provenance: --gates file missing");
      usage();
      return 2;
    }
    gates = JSON.parse(fs.readFileSync(gatesPath, "utf8"));
  }
  const sha = readArg(argv, "--sha") || readSha();
  const manifest = buildManifest({
    sha,
    artifactHash: hashArtifact(artifactRoot),
    files: ARTIFACT_FILES,
    localStatic: readArg(argv, "--local-static"),
    localNext: readArg(argv, "--local-next"),
    deployed: readArg(argv, "--deployed"),
    gates,
  });
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ out: outPath, sha: manifest.sha, hash: manifest.artifact.hash, binding: manifest.binding }));
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(err.message || err);
  process.exit(2);
}
