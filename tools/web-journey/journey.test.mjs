import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  briefing,
  initialSession,
  promote,
  promotionFromSearch,
  renderVariantHtml,
  resolveView,
} from "../../fixtures/web-journey/static/assets/model.mjs";
import {
  buildManifest,
  classifyAddress,
  hashArtifact,
  unboundManifest,
  verifyProvenance,
} from "./provenance.mjs";
import { startPreviewHost, staticGates } from "./prove-load.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const artifactRoot = path.join(repoRoot, "fixtures", "web-journey", "static");
const nextView = path.join(repoRoot, "examples", "web-seed", "app", "briefing", "view.tsx");

test("variants diverge on density, personality, and interaction", () => {
  const variants = briefing.variants;
  assert.equal(variants.length, 3);
  for (const key of ["axis", "density", "personality", "interaction"]) {
    assert.equal(new Set(variants.map((variant) => variant[key])).size, 3, key);
  }
});

test("list, filter, empty, error, and loading stay distinct", () => {
  const list = resolveView({ filterId: "all", phase: "ready" });
  assert.equal(list.state, "list");
  assert.deepEqual(
    list.items.map((item) => item.id),
    ["BL-104", "BL-118", "BL-121", "BL-130"],
  );
  const waiting = resolveView({ filterId: "waiting" });
  assert.deepEqual(
    waiting.items.map((item) => item.id),
    ["BL-104"],
  );
  const empty = resolveView({ filterId: "archive" });
  assert.equal(empty.state, "empty");
  assert.equal(empty.items.length, 0);
  assert.equal(resolveView({ phase: "error" }).state, "error");
  assert.equal(resolveView({ phase: "loading" }).state, "loading");
  assert.equal(resolveView({ phase: "loading" }).items.length, 0);
});

test("rendered variants do not share a layout", () => {
  const ready = { filterId: "all", phase: "ready", selectedId: "BL-118" };
  const quiet = renderVariantHtml({ ...ready, variantId: "quiet" });
  const ledger = renderVariantHtml({ ...ready, variantId: "ledger" });
  const split = renderVariantHtml({ ...ready, variantId: "split" });
  assert.notEqual(quiet, ledger);
  assert.notEqual(ledger, split);
  assert.match(quiet, /class="quiet-sheet"/);
  assert.match(quiet, /data-axis="editorial-sparse"/);
  assert.doesNotMatch(quiet, /ledger-rows/);
  assert.match(ledger, /class="ledger-rows"/);
  assert.match(ledger, /data-axis="compact-scan"/);
  assert.doesNotMatch(ledger, /quiet-sheet/);
  assert.match(split, /<aside/);
  assert.match(split, /data-pane="detail"/);
  assert.match(split, /data-axis="master-detail"/);
  assert.doesNotMatch(split, /ledger-rows/);
  for (const html of [quiet, ledger, split]) {
    assert.match(html, /BL-118/);
    assert.match(html, /Paleta da vitrine de inverno/);
  }
  const empty = renderVariantHtml({ variantId: "ledger", filterId: "archive", phase: "ready" });
  assert.match(empty, /data-state="empty"/);
  assert.match(empty, /Nenhum briefing com esse filtro/);
  assert.doesNotMatch(empty, /BL-104/);
  const error = renderVariantHtml({ variantId: "quiet", phase: "error" });
  assert.match(error, /data-state="error"/);
  assert.match(error, /A fila não respondeu/);
  const loading = renderVariantHtml({ variantId: "split", phase: "loading" });
  assert.match(loading, /data-state="loading"/);
  assert.match(loading, /Carregando a fila do ateliê/);
  assert.doesNotMatch(loading, /BL-130/);
});

test("promotion waits for a human choice", () => {
  const open = initialSession();
  assert.equal(open.promotedId, null);
  assert.equal(open.direction, "open");
  assert.throws(() => promote(open, "quiet", "script"), /human choice/);
  assert.throws(() => promote(open, "quiet", "auto"), /human choice/);
  const picked = promote(open, "ledger", "human");
  assert.equal(picked.promotedId, "ledger");
  assert.equal(picked.direction, "promoted");
  assert.equal(open.promotedId, null);
  assert.equal(promotionFromSearch({}).promoted, false);
  assert.equal(promotionFromSearch({ promoted: "quiet" }).promoted, false);
  assert.equal(promotionFromSearch({ v: "quiet", promoted: "ledger", actor: "human" }).promoted, false);
  const accepted = promotionFromSearch({ v: "split", promoted: "split", actor: "human" });
  assert.equal(accepted.promoted, true);
  assert.equal(accepted.session.promotedId, "split");
});

test("the Next screen reuses components/ui and the three axes", () => {
  const source = fs.readFileSync(nextView, "utf8");
  assert.match(source, /from "@\/components\/ui"/);
  assert.match(source, /\bButton\b/);
  assert.match(source, /\bStack\b/);
  assert.doesNotMatch(source, /export\s+function\s+Button\b/);
  assert.match(source, /data-axis=\{variant\.axis\}/);
  assert.match(source, /Promover esta direção/);
  assert.match(source, /name="actor" value="human"/);
  const fixtureModel = fs.readFileSync(
    path.join(artifactRoot, "assets", "model.mjs"),
    "utf8",
  );
  const nextModel = fs.readFileSync(
    path.join(repoRoot, "examples", "web-seed", "app", "briefing", "model.mjs"),
    "utf8",
  );
  assert.equal(nextModel, fixtureModel);
});

test("the static shell does not promote itself", () => {
  const html = fs.readFileSync(path.join(artifactRoot, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(artifactRoot, "assets", "app.js"), "utf8");
  assert.match(html, /Direção aberta\. Nenhuma variante foi promovida\./);
  assert.doesNotMatch(html, /Promovida por escolha humana/);
  assert.match(html, /href="\/assets\/app\.css"/);
  assert.match(html, /src="\/assets\/app\.js"/);
  assert.match(html, /href="\/assets\/mark\.svg"/);
  assert.match(js, /promote\(session, variant\.id, "human"\)/);
  assert.doesNotMatch(js, /promote\([^)]*"(auto|script)"/);
});

test("addresses separate loopback, private, and public hosts", () => {
  assert.equal(classifyAddress("http://127.0.0.1:4173/"), "loopback");
  assert.equal(classifyAddress("http://localhost:3000/briefing"), "loopback");
  assert.equal(classifyAddress("http://[::1]:4173/"), "loopback");
  assert.equal(classifyAddress("http://192.168.0.8:4173/"), "private");
  assert.equal(classifyAddress("http://10.0.0.4/"), "private");
  assert.equal(classifyAddress("https://preview.example.com/briefing"), "public");
  assert.equal(classifyAddress("http://user:secret@127.0.0.1:4173/"), "credentialed");
});

test("a changed SHA or artifact invalidates the snapshot", () => {
  const hash = hashArtifact(artifactRoot);
  const gates = [{ id: "static-page", ok: true, detail: "GET / 200" }];
  const manifest = buildManifest({
    sha: "a".repeat(40),
    artifactHash: hash,
    localStatic: "http://127.0.0.1:4181/",
    localNext: "http://127.0.0.1:3210/briefing",
    deployed: null,
    gates,
  });
  assert.deepEqual(verifyProvenance(manifest, { head: "a".repeat(40), artifactHash: hash }), {
    ok: true,
    status: "current",
    reason: "SHA, artifact hash, mode, and gates match.",
  });
  const staleSha = verifyProvenance(manifest, { head: "b".repeat(40), artifactHash: hash });
  assert.equal(staleSha.ok, false);
  assert.equal(staleSha.status, "stale");
  const staleHash = verifyProvenance(manifest, { head: "a".repeat(40), artifactHash: "c".repeat(64) });
  assert.equal(staleHash.status, "stale");
  const unbound = verifyProvenance(unboundManifest(), { head: "a".repeat(40), artifactHash: hash });
  assert.equal(unbound.status, "unbound");
  assert.throws(
    () => buildManifest({ artifactHash: hash, localStatic: "http://127.0.0.1:4181/", deployed: "http://127.0.0.1:4181/" }),
    /public host/,
  );
  assert.throws(
    () =>
      buildManifest({
        artifactHash: hash,
        localStatic: "http://127.0.0.1:4181/",
        localNext: "http://127.0.0.1:4181/briefing",
      }),
    /must not share an origin/,
  );
  const forged = {
    ...manifest,
    urls: { ...manifest.urls, deployed: "http://127.0.0.1:4173/" },
  };
  assert.equal(verifyProvenance(forged, { head: "a".repeat(40), artifactHash: hash }).status, "invalid");
});

test("preview host serves the dedicated artifact and a public health ok", async () => {
  const host = await startPreviewHost(4291);
  try {
    const gates = await staticGates("http://127.0.0.1:4291");
    const failed = gates.filter((gate) => !gate.ok);
    assert.deepEqual(failed, []);
  } finally {
    host.kill("SIGTERM");
  }
});
