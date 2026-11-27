# OpenDesigma evals (MVP seed)

Outcome-focused checks for the web seed (**DS reuse**, **DS lint**, **design
contract**, **Context7 map**, **a11y smoke**, **Next build**) plus light
**Expo mobile path** and **optional backend path** smokes. Deterministic
graders — no LLM judge yet (`design-jury` is the agent scorecard).

## Prerequisites

- Node.js 20+
- For `build-smoke`: `pnpm` and a one-time `pnpm install` inside
  `examples/web-seed/`

```sh
cd examples/web-seed && pnpm install && cd ../..
```

## Run all

From the **repository root**:

```sh
node evals/run.mjs
```

Skip the slower production build:

```sh
node evals/run.mjs --skip-build
```

Run a single eval by id:

```sh
node evals/run.mjs --only ds-reuse
node evals/run.mjs --only ds-lint
node evals/run.mjs --only build-smoke
```

Write the same JSON document to a file (stdout is unchanged):

```sh
node evals/run.mjs --skip-build --out evals-report.json
```

Standalone lint CLI: `node tools/ds-lint/ds-lint.mjs` (see
[`docs/design-jury.md`](../docs/design-jury.md)).

Contract test (no install): `node --test evals/run.test.mjs`.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Every **executed** check passed. An intentional skip does not fail the run. |
| `1` | At least one executed check failed. |
| `2` | Usage error: unknown option, missing value (`--only` / `--out`), repeated `--only`, unexpected argument, or `--only` id that is not in the catalog (empty selection). |

Stdout is one JSON document in every case, including usage errors. Human lines go to stderr.

`results[]` lists only checks that ran. Each row keeps `id`, `title`, `ok`, `message`, and `details`, plus `status` (`passed` or `failed`). `total` and `executed` are that list's length.

Skipped checks are **not** folded into `results` (so `ok: true` still means the check passed). They are published in `skippedChecks` as `{ id, title, status: "skipped", reason }`. `--skip-build` skips `build-smoke` with reason `--skip-build`. A check may also return `{ status: "skipped", reason }` (or `skipped: true`).

Counts on the summary: `executed`, `passed`, `failed`, `skipped`. `sha` is `git rev-parse HEAD` when git is available.

## Catalog

| Id | What it measures | Fixture |
| --- | --- | --- |
| `design-contract` | `DESIGN.md` + `tokens.css` present; globals import tokens; required CSS vars | `examples/web-seed` |
| `ds-reuse` | App UI imports `@/components/ui`; no invented second Button; token usage | `examples/web-seed` |
| `ds-lint` | Invalid `var(--*)`, invented protected primitives, registry sync (`tools/ds-lint`) | `examples/web-seed` |
| `context7-map` | `context7.json` + docs map list required library IDs | repo root |
| `a11y-smoke` | `lang` on `<html>`, buttons have explicit `type`, focus styles present | `examples/web-seed` |
| `mobile-path` | Expo seed + `DESIGN.md`/`tokens.ts` + skills + docs (no store build) | `examples/mobile-seed` |
| `backend-path` | API seed + scaffold-backend + backend/round-trip docs (no Next install) | `examples/api-seed` |
| `build-smoke` | `pnpm build` succeeds in the seed | `examples/web-seed` |

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) is the baseline. Permissions are `contents: read`. Jobs do not depend on each other, so a network or toolchain failure does not skip the deterministic evals.

| Job | Runner | What it does |
| --- | --- | --- |
| `evals` | `ubuntu-latest` and `windows-latest` | `node --test evals/run.test.mjs`, `node evals/run.mjs --skip-build`, `node tools/ds-lint/ds-lint.mjs`. No package install. |
| `web-seed` | `ubuntu-latest` | `pnpm install --frozen-lockfile` (pnpm from `examples/web-seed/package.json` `packageManager`), `pnpm lint`, then `node evals/run.mjs --only build-smoke` (`pnpm build`). Store cache key is `examples/web-seed/pnpm-lock.yaml`. |
| `cargo` | `ubuntu-latest` | Rust **1.93.1** (same channel as `rust-toolchain.toml`) plus `clippy` / `rustfmt`. `cargo check --locked --workspace` and `cargo test --locked -p desigma-doc -p desigma-engine -p desigma-mcp -- --test-threads=1`. Cache follows `Cargo.lock`. If the toolchain action fails, the job records the blocker in the step summary and stops; the other jobs still run. |

The Windows/Linux matrix covers the deterministic runner because check paths use `path.join` / `path.sep`. The web-seed and cargo jobs stay on Linux: they need a network install or the Rust toolchain, and this baseline was measured on Linux. `build-smoke` spawns `pnpm` with a shell only on Windows, so a later Windows build job can call the same check. Symlink tests in `desigma-mcp` are `#[cfg(unix)]` and are omitted on Windows; they are not the reason the cargo job is Linux-only.

Each eval job writes a JSON report and a step summary with executados / aprovados / reprovados / pulados and the SHA (`git rev-parse HEAD` in the JSON, `github.sha` on the checkout).

## Adding an eval

1. Drop a module under `evals/checks/` exporting `{ id, title, run(ctx) }`.
2. Register it in `evals/run.mjs` `CHECK_MODULES`.
3. Keep graders deterministic (filesystem / build / regex). LLM-as-judge = later.

## Non-goals (MVP)

- Visual pixel diff (`desigma-diff`) wiring
- Multi-trial agent hillclimbing
- Live Context7 API quota checks
