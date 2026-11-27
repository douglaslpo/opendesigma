/**
 * Provenance for the web journey.
 *
 * The manifest binds a git SHA, an execution mode, the static artifact hash,
 * and the gates that were actually run. `provenance.json` is not part of the
 * hash. A later commit or a changed artifact makes `verifyProvenance` report
 * `stale` until `write-provenance` is run again.
 *
 * Loopback addresses stay local. A deployed preview is a public URL or null.
 * The static preview host and the Next runtime are different origins.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const SCHEMA = "opendesigma.provenance/v1";

export const ARTIFACT_FILES = [
  "index.html",
  "assets/app.css",
  "assets/app.js",
  "assets/model.mjs",
  "assets/mark.svg",
];

export const STATIC_ROOT = "fixtures/web-journey/static";
export const NEXT_PACKAGE = "examples/web-seed";
export const NEXT_ROUTE = "/briefing";

export function hashArtifact(root, files = ARTIFACT_FILES) {
  const hash = createHash("sha256");
  const missing = [];
  for (const rel of [...files].sort()) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
      missing.push(rel);
      continue;
    }
    hash.update(rel.replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(fs.readFileSync(full));
    hash.update("\0");
  }
  if (missing.length) {
    throw new Error(`artifact missing: ${missing.join(", ")}`);
  }
  return hash.digest("hex");
}

export function classifyAddress(urlString) {
  if (!urlString) return null;
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return "invalid";
  }
  if (url.username || url.password) return "credentialed";
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") {
    return "loopback";
  }
  if (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local")
  ) {
    return "private";
  }
  return "public";
}

function runtimeBlock() {
  return {
    staticPreview: {
      kind: "dedicated-artifact",
      root: STATIC_ROOT,
      host: "packages/preview-host",
    },
    nextInteractive: {
      kind: "separate-runtime",
      package: NEXT_PACKAGE,
      route: NEXT_ROUTE,
      command: "pnpm dev | pnpm start",
    },
  };
}

export function unboundManifest() {
  return {
    schema: SCHEMA,
    sha: null,
    binding: "unbound",
    executionMode: "split",
    runtimes: runtimeBlock(),
    artifact: {
      algorithm: "sha256",
      hash: null,
      files: [...ARTIFACT_FILES].sort(),
    },
    urls: {
      localStatic: null,
      localNext: null,
      deployed: null,
    },
    addressClass: {
      localStatic: null,
      localNext: null,
      deployed: null,
    },
    gates: [],
    promoted: null,
    generatedAt: null,
  };
}

export function buildManifest({
  sha = null,
  artifactHash,
  files = ARTIFACT_FILES,
  localStatic = null,
  localNext = null,
  deployed = null,
  gates = [],
  promoted = null,
  generatedAt = new Date().toISOString(),
}) {
  const addressClass = {
    localStatic: classifyAddress(localStatic),
    localNext: classifyAddress(localNext),
    deployed: classifyAddress(deployed),
  };
  if (localStatic && addressClass.localStatic !== "loopback") {
    throw new Error(`local static URL must be loopback, got ${addressClass.localStatic}`);
  }
  if (localNext && addressClass.localNext !== "loopback") {
    throw new Error(`local Next URL must be loopback, got ${addressClass.localNext}`);
  }
  if (deployed && addressClass.deployed !== "public") {
    throw new Error(`deployed URL must be a public host, got ${addressClass.deployed}`);
  }
  if (localStatic && localNext && new URL(localStatic).origin === new URL(localNext).origin) {
    throw new Error("static preview and Next runtime must not share an origin");
  }
  return {
    schema: SCHEMA,
    sha: sha || null,
    binding: sha ? "snapshot" : "unbound",
    executionMode: "split",
    runtimes: runtimeBlock(),
    artifact: {
      algorithm: "sha256",
      hash: artifactHash,
      files: [...files].sort(),
    },
    urls: { localStatic, localNext, deployed: deployed || null },
    addressClass,
    gates,
    promoted,
    generatedAt,
  };
}

function problem(status, reason) {
  return { ok: false, status, reason };
}

export function verifyProvenance(manifest, { head, artifactHash }) {
  if (!manifest || manifest.schema !== SCHEMA) {
    return problem("invalid", "manifest schema is not opendesigma.provenance/v1");
  }
  if (manifest.executionMode !== "split") {
    return problem("invalid", "executionMode must stay split across static preview and Next");
  }
  const runtimes = manifest.runtimes || {};
  if (runtimes.staticPreview?.kind !== "dedicated-artifact") {
    return problem("invalid", "static preview must be a dedicated artifact");
  }
  if (runtimes.nextInteractive?.kind !== "separate-runtime") {
    return problem("invalid", "Next must stay on a separate runtime");
  }
  if (runtimes.staticPreview.root === runtimes.nextInteractive.package) {
    return problem("invalid", "static root and Next package must differ");
  }
  if (!manifest.sha || manifest.binding === "unbound") {
    return problem(
      "unbound",
      "Manifest is not bound to a commit. Run write-provenance after verification. A new SHA invalidates the previous snapshot.",
    );
  }
  if (manifest.sha !== head) {
    return problem(
      "stale",
      `SHA changed. Manifest records ${manifest.sha}; HEAD is ${head}. Previous evidence is invalidated until write-provenance runs again.`,
    );
  }
  if (!manifest.artifact?.hash || manifest.artifact.hash !== artifactHash) {
    return problem(
      "stale",
      "Artifact hash changed. Previous evidence is invalidated until write-provenance runs again.",
    );
  }
  const urls = manifest.urls || {};
  const classes = {
    localStatic: classifyAddress(urls.localStatic),
    localNext: classifyAddress(urls.localNext),
    deployed: classifyAddress(urls.deployed),
  };
  if (urls.localStatic && classes.localStatic !== "loopback") {
    return problem("invalid", "local static URL is not a loopback address");
  }
  if (urls.localNext && classes.localNext !== "loopback") {
    return problem("invalid", "local Next URL is not a loopback address");
  }
  if (urls.deployed && classes.deployed !== "public") {
    return problem("invalid", "deployed preview must be a public URL, never a loopback or private address");
  }
  if (urls.localStatic && urls.deployed && urls.localStatic === urls.deployed) {
    return problem("invalid", "local and deployed URLs must differ");
  }
  if (urls.localStatic && urls.localNext && new URL(urls.localStatic).origin === new URL(urls.localNext).origin) {
    return problem("invalid", "static preview and Next runtime share an origin");
  }
  if (urls.localNext) {
    const route = new URL(urls.localNext).pathname;
    if (!route.startsWith(NEXT_ROUTE)) {
      return problem("invalid", "local Next URL must point at /briefing");
    }
  }
  const gates = Array.isArray(manifest.gates) ? manifest.gates : [];
  const failed = gates.filter((gate) => !gate.ok);
  if (failed.length) {
    return problem("failed", `gates failed: ${failed.map((gate) => gate.id).join(", ")}`);
  }
  const needsNext = gates.some((gate) => String(gate.id).startsWith("next-") && gate.ok);
  if (needsNext && !urls.localNext) {
    return problem("invalid", "Next gates passed without a local Next URL");
  }
  const needsStatic = gates.some((gate) => String(gate.id).startsWith("static-") && gate.ok);
  if (needsStatic && !urls.localStatic) {
    return problem("invalid", "static gates passed without a local static URL");
  }
  return { ok: true, status: "current", reason: "SHA, artifact hash, mode, and gates match." };
}
