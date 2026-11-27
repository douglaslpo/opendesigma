# OpenDesigma evals (MVP seed)

Outcome-focused checks for the web seed (**DS reuse**, **design contract**,
**Context7 map**, **a11y smoke**, **Next build**) plus a light **Expo mobile
path** smoke. Deterministic graders — no LLM judge yet.

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
node evals/run.mjs --only build-smoke
```

Exit code `0` = all selected evals passed; non-zero = at least one failed.
JSON summary prints to stdout; human lines to stderr.

## Catalog

| Id | What it measures | Fixture |
| --- | --- | --- |
| `design-contract` | `DESIGN.md` + `tokens.css` present; globals import tokens; required CSS vars | `examples/web-seed` |
| `ds-reuse` | App UI imports `@/components/ui`; no invented second Button; token usage | `examples/web-seed` |
| `context7-map` | `context7.json` + docs map list required library IDs | repo root |
| `a11y-smoke` | `lang` on `<html>`, buttons have explicit `type`, focus styles present | `examples/web-seed` |
| `mobile-path` | Expo seed + `DESIGN.md`/`tokens.ts` + skills + docs (no store build) | `examples/mobile-seed` |
| `build-smoke` | `pnpm build` succeeds in the seed | `examples/web-seed` |

## Adding an eval

1. Drop a module under `evals/checks/` exporting `{ id, title, run(ctx) }`.
2. Register it in `evals/run.mjs` `CHECKS` array.
3. Keep graders deterministic (filesystem / build / regex). LLM-as-judge = later.

## Non-goals (MVP)

- Visual pixel diff (`desigma-diff`) wiring
- Multi-trial agent hillclimbing
- Live Context7 API quota checks
