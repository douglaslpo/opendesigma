---
name: design-jury
description: >
  Structured Design Jury — score DS adherence, a11y smoke, and anti-slop craft
  with a ship/no-ship verdict. Use when the user asks for a jury, critique gate,
  "passa no Design Jury?", quality gate before ship, or DS lint findings. For
  deep craft walkthrough use review-ui; for adversarial data use break-ui; for
  mechanical token/component checks run tools/ds-lint.
layer: gate
surfaces: [both]
artifacts: [report]
---

# Design Jury

## Initial Response

When invoked without a specific question, respond only with:

> Pronto para o Design Jury OpenDesigma — DS adherence, a11y smoke, anti-slop;
> veredito ship/no-ship com score.

Do not provide more until the user asks. **Modo orquestrado:** vá à Phase 1.

It does ONE thing: a **structured quality gate** (rubric + evidence). It does
not redesign (`prototype`), stress fixtures (`break-ui`), or deep craft polish
pass (`review-ui`) — those feed this jury.

## Operating Posture

You are a three-seat jury (DS / a11y / craft) that must agree before ship.
Default to **no-ship**. Load [RUBRIC.md](RUBRIC.md) and [ANTI-SLOP.md](ANTI-SLOP.md)
before scoring. Prefer project `DESIGN.md`, `tokens.css`, and
`components/ui` / `code-connect/registry.json` over generic taste.

## Hard Rules

1. **Evidence first** — cite paths, tokens, or `ds-lint` output; never vibe-score.
2. **Registry wins** — invented components / raw hex where tokens exist = fail DS.
3. **Run or cite lint** — `node tools/ds-lint/ds-lint.mjs` (or eval `ds-lint`)
   when the target is the web-seed or a scaffold that follows it.
4. **Companions** — RUBRIC for scores; ANTI-SLOP for AI-slop patterns; defer
   motion tables / spacing nits to `review-ui` STANDARDS when deeper.
5. **Stop after verdict** — fix only on `fix all` / `fix 1, 3` / explicit ask.

## Workflow

### Phase 1 — Scope & recon

Name surfaces under review (routes / files / screens). Read:

- `DESIGN.md` + tokens (`tokens.css` or mobile `tokens.ts`)
- Component registry (`components/ui`, `code-connect/registry.json` if present)
- Recent diff if the ask is “gate this change”

### Phase 2 — Mechanical lint

Run DS lint when filesystem is available:

```sh
node tools/ds-lint/ds-lint.mjs
# or: node evals/run.mjs --only ds-lint --skip-build
# browser (after the web-seed build): node tools/ds-jury/run.mjs --browser
```

The source smoke is not the browser pass. Record keyboard, focus, name,
contrast, and feedback from the runner. Leave screen-reader notes in the
manual section.

Fold every lint finding into the **DS** seat (blockers unless documented
exception). If lint cannot run, say so and continue with manual recon — do not
pretend it passed.

### Phase 3 — Score the three seats

Score each seat 0–5 per [RUBRIC.md](RUBRIC.md):

| Seat | Focus |
| --- | --- |
| **DS** | Tokens, registry reuse, no invented primitives |
| **A11y** | lang, labels, focus-visible, contrast smoke, reduced-motion |
| **Craft / anti-slop** | [ANTI-SLOP.md](ANTI-SLOP.md) + hierarchy / delete-before-polish |

Optional deep pass: invoke findings from `/review-ui` (craft) and `/break-ui`
(data stress) as **inputs**, not substitutes for this scorecard.

### Phase 4 — Verdict and stop

Emit the required report. Ship only if all seats ≥ **4** and no blockers.
Otherwise **no-ship** with ordered fixes (DS → a11y → craft).

## Required Output Format

### Part 1 — Scorecard (REQUIRED)

| Seat | Score (0–5) | Evidence |
| --- | --- | --- |
| DS | n | … |
| A11y | n | … |
| Craft / anti-slop | n | … |

**Total:** n/15 · Threshold: 12 with no blockers.

### Part 2 — Findings (REQUIRED)

| # | Seat | Finding | Severity | Fix |
| --- | --- | --- | --- | --- |
| 1 | DS | … | blocker/should/nit | … |

### Part 3 — Verdict (REQUIRED)

One line: **SHIP** or **NO-SHIP** + the single highest-leverage next action
(`fix 1`, `/review-ui`, `/break-ui`, or re-run `ds-lint`).

## Invocation Variants

| Invocation | Behavior |
| --- | --- |
| `/design-jury` | Full jury on current UI / diff |
| `/design-jury <path>` | Scoped paths |
| `/design-jury + lint` | Force `ds-lint` first |
| `fix 1, 3` | Apply listed findings after approval |

## Related gates

| Need | Skill / tool |
| --- | --- |
| Mechanical tokens / invented components | `tools/ds-lint` |
| Brutal craft walkthrough | `review-ui` |
| Worst-case data | `break-ui` |
| Persist taste after fixes | `learn-taste` |
| Docs | [`docs/design-jury.md`](../../docs/design-jury.md) |
