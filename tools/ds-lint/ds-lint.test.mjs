import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  NATIVE_DIVERGENCES,
  compareTokenSemantics,
  figmaMappingReport,
  lintSeed,
} from "./ds-lint.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const fixtures = path.join(here, "fixtures");
const webSeed = path.join(repo, "examples", "web-seed");
const mobileSeed = path.join(repo, "examples", "mobile-seed");

function ids(result) {
  return result.findings.map((row) => row.id);
}

test("accepted fixture has no findings", () => {
  const result = lintSeed(path.join(fixtures, "accepted", "aligned"));
  assert.equal(result.ok, true);
  assert.deepEqual(result.findings, []);
});

test("raw hex outside tokens.css is a nit and still passes", () => {
  const result = lintSeed(path.join(fixtures, "accepted", "raw-hex-nit"));
  assert.equal(result.ok, true);
  assert.ok(ids(result).includes("raw-hex"));
  assert.equal(result.summary.blockers, 0);
});

test("unknown token is rejected", () => {
  const result = lintSeed(path.join(fixtures, "rejected", "unknown-token"));
  assert.equal(result.ok, false);
  assert.ok(ids(result).includes("invalid-token"));
});

test("invented Button outside components/ui is rejected", () => {
  const result = lintSeed(path.join(fixtures, "rejected", "invented-button"));
  assert.equal(result.ok, false);
  assert.ok(ids(result).includes("invented-component"));
});

test("registry source path is checked even when the export exists elsewhere", () => {
  const missing = lintSeed(path.join(fixtures, "rejected", "registry-wrong-path"));
  assert.equal(missing.ok, false);
  assert.ok(ids(missing).includes("registry-missing-path"));

  const elsewhere = lintSeed(path.join(fixtures, "rejected", "registry-export-elsewhere"));
  assert.equal(elsewhere.ok, false);
  const finding = elsewhere.findings.find((row) => row.id === "registry-missing-export");
  assert.ok(finding);
  assert.match(finding.file, /stack\.tsx$/);
});

test("a declared template path that is missing is rejected", () => {
  const result = lintSeed(path.join(fixtures, "rejected", "registry-missing-template"));
  assert.equal(result.ok, false);
  assert.ok(ids(result).includes("registry-missing-template"));
});

test("token drift is rejected and documented native exceptions are not", () => {
  const web = path.join(fixtures, "rejected", "token-drift", "web");
  const mobile = path.join(fixtures, "rejected", "token-drift", "mobile", "tokens.ts");
  const result = lintSeed(web, { mobileTokensPath: mobile });
  assert.equal(result.ok, false);
  const drifts = result.findings.filter((row) => row.id === "token-drift");
  assert.equal(drifts.length, 1);
  assert.equal(drifts[0].token, "color.accent");
  const compared = compareTokenSemantics(fs.readFileSync(path.join(web, "tokens.css"), "utf8"), fs.readFileSync(mobile, "utf8"));
  assert.ok(compared.divergences.some((row) => row.id === "type-faces"));
  assert.ok(compared.matched.includes("color.canvas"));
  assert.ok(compared.matched.includes("space.1"));
  assert.ok(compared.matched.includes("motion.fast"));
});

test("web and mobile seeds share semantics and keep the native exceptions", () => {
  const result = lintSeed(webSeed, { mobileTokensPath: path.join(mobileSeed, "tokens.ts") });
  assert.equal(result.ok, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.summary.blockers, 0);
  assert.deepEqual(result.summary.tokenSemantics.drifts, []);
  assert.deepEqual(
    result.summary.tokenSemantics.divergences.map((row) => row.id),
    NATIVE_DIVERGENCES.map((row) => row.id),
  );
  assert.ok(result.summary.tokenSemantics.matched.includes("color.accent"));
  assert.ok(result.summary.tokenSemantics.matched.includes("space.16"));

  const webButton = fs.readFileSync(path.join(webSeed, "components", "ui", "button.tsx"), "utf8");
  const mobileButton = fs.readFileSync(path.join(mobileSeed, "components", "ui", "button.tsx"), "utf8");
  assert.match(webButton, /px-5/);
  assert.match(mobileButton, /space\[4\] \+ space\[1\]/);
});

test("figma mappings are stub or unmapped and none are published", () => {
  const report = figmaMappingReport(webSeed, mobileSeed);
  const web = report.rows.filter((row) => row.surface === "web");
  const mobile = report.rows.filter((row) => row.surface === "mobile");
  assert.deepEqual(web.map((row) => [row.id, row.status, row.published]), [
    ["button", "stub", false],
    ["stack", "stub", false],
  ]);
  assert.ok(mobile.some((row) => row.export === "Button" && row.status === "unmapped"));
  assert.ok(mobile.some((row) => row.export === "Stack" && row.status === "unmapped"));
  assert.equal(report.published, 0);
  assert.equal(report.linked, 0);

  const doc = fs.readFileSync(path.join(repo, "docs", "figma-mapping-status.md"), "utf8");
  for (const row of report.rows) {
    assert.match(doc, new RegExp(row.export));
    assert.match(doc, new RegExp(row.status));
  }
  assert.match(doc, /not published/i);
  const semantics = fs.readFileSync(path.join(repo, "docs", "token-semantics.md"), "utf8");
  assert.match(semantics, /examples\/web-seed\/tokens\.css/);
  for (const row of NATIVE_DIVERGENCES) assert.match(semantics, new RegExp(row.id));
});
