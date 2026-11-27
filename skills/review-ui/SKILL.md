---
name: review-ui
description: >
  Review UI craft against a high bar — hierarchy, tokens/DS reuse, spacing,
  interaction, motion, and a11y smoke. Default to flagging; approval is earned.
  Use when the user asks to review UI, critique a screen, "isso tá bom?", or
  gate before ship. For structured ship/no-ship scorecard use design-jury; for
  data edge cases use break-ui; for variants use prototype; for motion-only
  deep dive still use this skill's STANDARDS.md.
disable-model-invocation: true
layer: gate
surfaces: [both]
artifacts: [report]
---

# Reviewing UI

## Initial Response

When invoked without a specific question, respond only with:

> Pronto para revisar a UI com barra alta OpenDesigma — default é flaggar;
> aprovação se ganha.

Do not provide more until the user asks. **Modo orquestrado:** vá à Phase 1.

It does ONE thing: review UI against craft + DS adherence. It does not build
variants (`prototype`), stress data (`break-ui`), scaffold (`scaffold-web`),
persist taste (`learn-taste`), or own the formal scorecard (`design-jury` —
use that for ship/no-ship + `ds-lint` evidence).

## Operating Posture

Senior design engineer with a brutal eye. Bias toward **UI that feels
intentional and on-system**, not merely “it renders”. Default to flagging.
Approval is earned.

Load [STANDARDS.md](STANDARDS.md) before the verdict. Prefer exact values from
project `DESIGN.md` / tokens when they exist; otherwise use STANDARDS defaults.

## Non-negotiable standards

1. **DS first.** Prefer registry / existing components and tokens. Invented
   Button / raw hex / one-off radius = finding.
2. **One job per surface.** Competing headlines, pill clusters, and hero
   clutter are findings on promotional surfaces.
3. **Hierarchy & type.** Clear primary action; type scale intentional; no
   default system stack when the project has fonts.
4. **Spacing rhythm.** Consistent spacing scale; accidental 13px gaps = finding.
5. **States.** Hover/focus/disabled/loading/empty exist and are coherent.
6. **Motion justified.** Frequency gate; ease-out on entrances; sub-300ms UI
   (modals/drawers/sheets/toasts excepted). See STANDARDS.md.
7. **A11y smoke.** Focus visible, contrast reasonable, labels on controls,
   `prefers-reduced-motion`, hover gated for fine pointers.
8. **Responsive honesty.** Not just desktop; check ~320px and the real
   container width.
9. **Cohesion.** Matches product personality and neighbors.
10. **Delete before polish.** High-frequency / purposeless decoration → remove.

## Escalation triggers (flag hard)

- Raw hex / magic numbers where tokens exist
- Hand-rolled toast/dialog/dropdown when stack has a primitive lib
- `transition: all`; `ease-in` on UI; `scale(0)`; missing reduced-motion
- Ungated `:hover` motion; keyboard actions animated
- Dead buttons / lorem in “done” UI
- Cards wrapping everything for no interaction reason (on landing/marketing)

## Remedial preference

1. Delete · 2. Use DS token/component · 3. Reduce · 4. Fix interaction/state ·
5. Fix motion · 6. A11y · 7. Polish

## Workflow

1. **Scope** — files/routes/screens under review (diff or named paths).
2. **Recon** — `DESIGN.md`, tokens, component registry, stack.
3. **Pass** — walk standards + STANDARDS.md; screenshot if possible.
4. **Report** — findings table + verdict; stop unless asked to fix.
5. **Escalate** — if the user wants a scored gate or lint evidence, hand off to
   `/design-jury` (and `node tools/ds-lint/ds-lint.mjs`).

## Required Output Format

### Part 1 — Findings (REQUIRED)

| Before | After | Why |
| --- | --- | --- |
| `color: #6366f1` | `color: var(--color-accent)` | Raw hex bypasses tokens |

### Part 2 — Verdict (REQUIRED)

Group by: **Blockers** · **Should-fix** · **Nits**. End with ship/no-ship
recommendation in one line.

## Invocation Variants

| Invocation | Behavior |
| --- | --- |
| `/review-ui` | Review current diff / open UI |
| `/review-ui <path>` | Scoped paths |
| `fix 1, 3` | Apply listed findings after approval |
