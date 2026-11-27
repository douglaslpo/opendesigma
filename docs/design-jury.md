# Design Jury + DS lint

OpenDesigma quality gate for the **Should** blueprint slice: structured critique
(DS adherence · a11y smoke · anti-slop) plus a light mechanical lint so agents
cannot silently invent tokens or components.

Absorbs Open Design’s *Design Jury / critique* idea without cloning the OD
monolith — evidence + scorecard, not a 26-agent theater.

## Pieces

| Piece | Path | Role |
| --- | --- | --- |
| Skill | [`skills/design-jury/`](../skills/design-jury/) | Scorecard + ship/no-ship |
| Rubric | `skills/design-jury/RUBRIC.md` | 0–5 seats, threshold 12/15 |
| Anti-slop | `skills/design-jury/ANTI-SLOP.md` | AI/default UI signatures |
| Lint CLI | [`tools/ds-lint/`](../tools/ds-lint/) | Tokens, invented primitives, registry path + export, web/mobile semantics |
| Jury runner | [`tools/ds-jury/`](../tools/ds-jury/) | break-ui → review-ui → ds-lint → scorecard, plus the browser probe |
| Eval | `evals/checks/ds-lint.mjs` | Wired into `evals/run.mjs` |
| Review bench | `examples/web-seed/app/ds-review` | Extreme copy, 320px, large text, empty / error / loading |

## When to run

```
break-ui → review-ui → design-jury → ship-preview
                 ↘ ds-lint (mechanical)
```

- **`/design-jury`** — human or harness verify before calling a surface done.
- **`ds-lint`** — always safe; cheap; required evidence for the DS seat.
- **`/review-ui`** — deeper craft walkthrough (feeds Craft seat).
- **`/break-ui`** — adversarial data (does not replace jury scores).

Router: [`skills/ask-desigma`](../skills/ask-desigma/SKILL.md) maps “passa no
jury?” / quality gate → `design-jury`.

## Commands

```sh
# Mechanical lint (web-seed default, compares mobile tokens when the sibling exists)
node tools/ds-lint/ds-lint.mjs
node tools/ds-lint/ds-lint.mjs --json

# Fixture + scorecard tests (no browser)
node --test tools/ds-lint/ds-lint.test.mjs tools/ds-jury/pipeline.test.mjs

# Full pipeline. --browser is the Chrome pass and needs a built web-seed.
cd examples/web-seed && pnpm install --frozen-lockfile && pnpm build && cd ../..
node tools/ds-jury/run.mjs --browser --shots /tmp/ds-jury

# Eval slice
node evals/run.mjs --only ds-lint --skip-build
```

`a11y-smoke` reads source (lang, button type, focus-visible, reduced motion).
It does not open a browser. Keyboard, focus, accessible name, contrast, and
feedback are the `--browser` stage. A screen reader is still a manual pass;
the runner caps A11y at 4 and says so.

## Verdict rule

Ship only if **DS ≥ 4**, **A11y ≥ 4**, **Craft ≥ 4**, and **zero blockers**.
Lint blockers auto-fail the DS seat.

## Non-goals

- LLM-as-judge inside `evals/` (deterministic graders only)
- Full WCAG engine / contrast lab
- Pixel visual-diff wiring (`desigma-diff` = later verify)
- OD Critique Theater UI / multi-agent cosplay

## Related

- Blueprint: Qualidade & governança → Design Jury / DS lint (Should)
- Craft standards: [`skills/review-ui/STANDARDS.md`](../skills/review-ui/STANDARDS.md)
- Web seed contract: [`examples/web-seed/DESIGN.md`](../examples/web-seed/DESIGN.md)
