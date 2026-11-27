import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/cli.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "evals", "run.mjs");

const CATALOG = [
  "design-contract",
  "ds-reuse",
  "ds-lint",
  "context7-map",
  "a11y-smoke",
  "mobile-path",
  "backend-path",
  "build-smoke",
];

function run(args) {
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  let json = null;
  let parseError = null;
  try {
    json = JSON.parse(result.stdout);
  } catch (err) {
    parseError = err;
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json, parseError };
}

function assertJson(result) {
  assert.equal(result.parseError, null, result.stdout);
  assert.equal(typeof result.json.ok, "boolean");
  assert.ok(Array.isArray(result.json.results));
  assert.ok(Array.isArray(result.json.skippedChecks));
  for (const row of result.json.results) {
    assert.equal(typeof row.id, "string");
    assert.equal(typeof row.ok, "boolean");
  }
}

test("parseArgs rejects unknown options, missing values, and empty selection tokens", () => {
  assert.deepEqual(parseArgs(["--skip-build"]).errors, []);
  assert.equal(parseArgs(["--only", "ds-lint"]).opts.only, "ds-lint");
  assert.equal(parseArgs(["--only=ds-lint"]).opts.only, "ds-lint");
  assert.ok(parseArgs(["--nope"]).errors.some((e) => e.includes("unknown option")));
  assert.ok(parseArgs(["--only"]).errors.some((e) => e.includes("requires a value")));
  assert.ok(parseArgs(["--only="]).errors.some((e) => e.includes("requires a value")));
  assert.ok(parseArgs(["--only", "--skip-build"]).errors.some((e) => e.includes("requires a value")));
  assert.ok(parseArgs(["--only", ""]).errors.some((e) => e.includes("requires a value")));
  assert.ok(parseArgs(["extra"]).errors.some((e) => e.includes("unexpected argument")));
  assert.ok(parseArgs(["--only", "a", "--only", "b"]).errors.some((e) => e.includes("repeated")));
  assert.ok(parseArgs(["--out"]).errors.some((e) => e.includes("requires a value")));
});

test("unknown --only id exits 2 with valid JSON and an empty selection", () => {
  const result = run(["--only", "inexistente"]);
  assert.equal(result.status, 2);
  assertJson(result);
  assert.equal(result.json.ok, false);
  assert.equal(result.json.error, "usage");
  assert.equal(result.json.total, 0);
  assert.equal(result.json.executed, 0);
  assert.equal(result.json.results.length, 0);
  assert.match(result.json.message, /inexistente/);
  assert.deepEqual(result.json.knownIds, CATALOG);
});

test("unknown option and missing --only value exit 2", () => {
  for (const args of [["--nope"], ["--only"], ["--only="], ["positional"]]) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(" "));
    assertJson(result);
    assert.equal(result.json.error, "usage");
    assert.equal(result.json.results.length, 0);
  }
});

test("--help exits 0 and keeps ids in JSON", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assertJson(result);
  assert.equal(result.json.help, true);
  assert.deepEqual(result.json.knownIds, CATALOG);
});

test("--skip-build passes static checks and records the skipped build with a reason", () => {
  const result = run(["--skip-build"]);
  assert.equal(result.status, 0);
  assertJson(result);
  assert.equal(result.json.ok, true);
  assert.equal(result.json.failed, 0);
  assert.deepEqual(
    result.json.results.map((row) => row.id),
    CATALOG.filter((id) => id !== "build-smoke"),
  );
  assert.equal(result.json.executed, 7);
  assert.equal(result.json.passed, 7);
  assert.equal(result.json.skipped, 1);
  assert.deepEqual(result.json.skippedChecks, [
    {
      id: "build-smoke",
      title: "Next.js production build smoke",
      status: "skipped",
      reason: "--skip-build",
    },
  ]);
  assert.equal(result.json.results.every((row) => row.status === "passed"), true);
});

test("--only runs one check and preserves its id", () => {
  const result = run(["--only", "ds-lint"]);
  assert.equal(result.status, 0);
  assertJson(result);
  assert.deepEqual(
    result.json.results.map((row) => row.id),
    ["ds-lint"],
  );
  assert.equal(result.json.skipped, 0);
});

test("--out writes the same JSON document", () => {
  const out = path.join(os.tmpdir(), `od-evals-${process.pid}.json`);
  try {
    const result = run(["--only", "context7-map", "--out", out]);
    assert.equal(result.status, 0);
    assertJson(result);
    const fromFile = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.deepEqual(fromFile, result.json);
    assert.equal(fromFile.results[0].id, "context7-map");
  } finally {
    fs.rmSync(out, { force: true });
  }
});
