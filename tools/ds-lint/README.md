# DS lint (light)

Mechanical Design System checks for OpenDesigma scaffolds (default:
`examples/web-seed`). Feeds the **Design Jury** (`skills/design-jury`) and the
`ds-lint` eval.

## Checks

| Id | Severity | What |
| --- | --- | --- |
| `invalid-token` | blocker | `var(--x)` not defined in `tokens.css` / globals |
| `invented-component` | blocker | Protected primitive exported outside `components/ui` |
| `registry-missing-path` | blocker | `source` path missing (`designMd` / `tokens` fields are `should`) |
| `registry-missing-export` | blocker | `export` is not exported by that source file |
| `registry-barrel-missing` | blocker | Import targets `components/ui` but the barrel does not re-export |
| `registry-missing-template` | blocker | `template` is set and the file is missing |
| `registry-missing` | should | No registry file |
| `token-drift` | blocker | Shared color / space / motion differs from `examples/mobile-seed/tokens.ts` |
| `raw-hex` | nit | `#rgb` / `#rrggbb` outside `tokens.css` |

Canonical token file: `examples/web-seed/tokens.css`. Native exceptions
(type faces, ease curve, rem vs px, button padding) are reported, not failed.
See [`docs/token-semantics.md`](../../docs/token-semantics.md). Fixtures live in
`tools/ds-lint/fixtures/` (`accepted/` passes, `rejected/` does not).

```sh
node --test tools/ds-lint/ds-lint.test.mjs
```

`ok` / exit `0` requires **zero blockers**. Should/nit findings still print for
agents and Design Jury.

## Run

From the repository root:

```sh
node tools/ds-lint/ds-lint.mjs
node tools/ds-lint/ds-lint.mjs --json
node tools/ds-lint/ds-lint.mjs --root examples/web-seed
```

Via evals:

```sh
node evals/run.mjs --only ds-lint --skip-build
```

## Non-goals

- Full contrast math / WCAG engine
- Tailwind class → token resolution
- Visual / screenshot diff (`desigma-diff`)
- LLM-as-judge (that is `design-jury`)
