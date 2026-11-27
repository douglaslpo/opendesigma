# DS lint (light)

Mechanical Design System checks for OpenDesigma scaffolds (default:
`examples/web-seed`). Feeds the **Design Jury** (`skills/design-jury`) and the
`ds-lint` eval.

## Checks

| Id | Severity | What |
| --- | --- | --- |
| `invalid-token` | blocker | `var(--x)` not defined in `tokens.css` / globals |
| `invented-component` | blocker | Protected primitive exported outside `components/ui` |
| `registry-missing-export` | blocker | `code-connect/registry.json` lists export not in UI |
| `registry-missing` | should | No registry file |
| `raw-hex` | nit | `#rgb` / `#rrggbb` outside `tokens.css` |

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
