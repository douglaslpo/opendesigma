import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "./contrast.mjs";
import { PIPELINE, assessBreak, assessReview, scoreJury } from "./pipeline.mjs";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel) {
  return fs.readFileSync(path.join(repo, rel), "utf8");
}

const bench = read("examples/web-seed/app/ds-review/bench.tsx");
const globals = read("examples/web-seed/app/globals.css");
const button = read("examples/web-seed/components/ui/button.tsx");

test("pipeline order is break-ui, review-ui, ds-lint, design-jury", () => {
  assert.deepEqual(PIPELINE, ["break-ui", "review-ui", "ds-lint", "design-jury"]);
});

test("the review bench covers extreme copy, critical states, and wrapping", () => {
  const report = assessBreak(bench, globals);
  assert.equal(report.ok, true, JSON.stringify(report.failures));
  const review = assessReview({ benchSrc: bench, buttonSrc: button, globalsSrc: globals });
  assert.equal(review.ok, true, JSON.stringify(review.failures));
});

test("seed token pairs used by the bench clear WCAG AA", () => {
  assert.ok(contrastRatio("#132029", "#e6eef3") >= 4.5);
  assert.ok(contrastRatio("#4a5d6a", "#e6eef3") >= 4.5);
  assert.ok(contrastRatio("#f4fffc", "#0c7c72") >= 4.5);
  assert.ok(contrastRatio("#0c7c72", "#e6eef3") >= 3);
});

test("mechanical jury ships only at the rubric threshold", () => {
  const lint = { ok: true, summary: { blockers: 0, should: 0, nits: 0 } };
  const browser = { ok: true, failures: [] };
  const review = { ok: true, failures: [] };
  const breakReport = { ok: true, failures: [] };
  const ship = scoreJury({ lint, browser, review, breakReport });
  assert.equal(ship.verdict, "SHIP");
  assert.ok(ship.ds >= 4);
  assert.equal(ship.a11y, 4);
  assert.equal(ship.craft, 4);
  assert.equal(ship.blockers, 0);

  const blocked = scoreJury({
    lint: { ok: false, summary: { blockers: 1, should: 0, nits: 0 } },
    browser,
    review,
    breakReport,
  });
  assert.equal(blocked.verdict, "NO-SHIP");
  assert.ok(blocked.ds <= 2);

  const unseen = scoreJury({ lint, browser: null, review, breakReport });
  assert.equal(unseen.verdict, "NO-SHIP");
  assert.equal(unseen.a11y, 2);
});
