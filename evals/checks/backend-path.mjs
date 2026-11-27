import path from "node:path";
import { exists, fail, pass, readText } from "../lib/fs.mjs";

export const id = "backend-path";
export const title = "Optional backend path seed + skills";

/**
 * Light smoke: filesystem contract for the optional API path.
 * Does not run Next install/build (use build-smoke on web-seed / manual api-seed).
 */
export function run(ctx) {
  const api = path.join(ctx.root, "examples", "api-seed");
  const docs = path.join(ctx.root, "docs", "backend-path.md");
  const roundTrip = path.join(ctx.root, "docs", "round-trip.md");
  const scaffoldSkill = path.join(ctx.root, "skills", "scaffold-backend", "SKILL.md");
  const shipRoundTrip = path.join(ctx.root, "skills", "ship-preview", "ROUNDTRIP.md");

  const requiredFiles = [
    path.join(api, "package.json"),
    path.join(api, "app", "api", "health", "route.ts"),
    path.join(api, "app", "api", "echo", "route.ts"),
    path.join(api, "lib", "read-limited-body.mjs"),
    path.join(api, "app", "page.tsx"),
    path.join(api, "AGENTS.md"),
    path.join(api, "README.md"),
    docs,
    roundTrip,
    scaffoldSkill,
    shipRoundTrip,
  ];

  const missing = requiredFiles.filter((p) => !exists(p));
  if (missing.length) {
    return fail("Backend path files missing", {
      missing: missing.map((p) => path.relative(ctx.root, p)),
    });
  }

  const health = readText(path.join(api, "app", "api", "health", "route.ts"));
  if (!/export\s+async\s+function\s+GET\b/.test(health)) {
    return fail("health route must export GET");
  }
  if (!/ok:\s*true/.test(health)) {
    return fail("health route should return ok: true");
  }

  const echo = readText(path.join(api, "app", "api", "echo", "route.ts"));
  if (!/export\s+async\s+function\s+POST\b/.test(echo)) {
    return fail("echo route must export POST");
  }
  if (!/application\/json/.test(echo)) {
    return fail("echo route should check application/json content-type");
  }
  if (/request\.(text|json)\(/.test(echo)) {
    return fail("echo must not buffer the body with request.text() or request.json()");
  }
  if (/\.length\s*>\s*MAX_/.test(echo)) {
    return fail("echo must not compare the byte cap to string length");
  }
  if (!/byteLength === 0/.test(echo)) {
    return fail("echo must define the empty-body (0 bytes) path");
  }
  if (!/status:\s*413/.test(echo)) {
    return fail("echo must reject oversized bodies with 413");
  }

  const limiter = readText(path.join(api, "lib", "read-limited-body.mjs"));
  if (!/byteLength/.test(limiter) || !/\.read\(/.test(limiter)) {
    return fail("byte limit must count octets while reading the stream");
  }

  const pkg = JSON.parse(readText(path.join(api, "package.json")));
  if (!pkg.dependencies?.next) {
    return fail("api-seed package.json must depend on next");
  }
  if (!pkg.dependencies?.react) {
    return fail("api-seed package.json must depend on react");
  }

  const doc = readText(docs);
  if (!/UI-only|só-UI|só UI/i.test(doc)) {
    return fail("docs/backend-path.md must keep UI-only as default");
  }
  if (!/Later/i.test(doc)) {
    return fail("docs/backend-path.md must call out Later (auth/DB product)");
  }
  if (!/Hono/i.test(doc)) {
    return fail("docs/backend-path.md must mention Hono as opt-in");
  }

  const rt = readText(roundTrip);
  if (!/promote/i.test(rt) || !/PR/i.test(rt)) {
    return fail("docs/round-trip.md must cover promote → PR");
  }
  if (!/merge/i.test(rt)) {
    return fail("docs/round-trip.md must mention merge policy");
  }

  const skill = readText(scaffoldSkill);
  if (!/scaffold-backend/.test(skill) || !/route handlers/i.test(skill)) {
    return fail("scaffold-backend skill must describe Next route handlers");
  }

  const ask = readText(path.join(ctx.root, "skills", "ask-desigma", "SKILL.md"));
  if (!/scaffold-backend/.test(ask)) {
    return fail("ask-desigma must wire scaffold-backend");
  }

  const pick = readText(path.join(ctx.root, "skills", "pick-stack", "SKILL.md"));
  if (!/scaffold-backend/.test(pick)) {
    return fail("pick-stack must reference scaffold-backend");
  }

  const ship = readText(path.join(ctx.root, "skills", "ship-preview", "SKILL.md"));
  if (!/ROUNDTRIP|round-trip/i.test(ship)) {
    return fail("ship-preview must reference round-trip / ROUNDTRIP");
  }

  return pass("Backend path seed, docs, round-trip, and skills present", {
    seed: "examples/api-seed",
    skills: ["scaffold-backend"],
    docs: ["backend-path.md", "round-trip.md"],
  });
}
