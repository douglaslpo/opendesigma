# Design Jury rubric

Score each seat **0–5**. Cite evidence (file, token, lint id). Project
`DESIGN.md` / tokens / registry override generic preferences.

**Ship threshold:** all seats ≥ 4 **and** zero blockers · **Total ≥ 12/15**.

## DS adherence (seat)

| Score | Meaning |
| --- | --- |
| 5 | Only registry components; all colors/space/motion via tokens; `ds-lint` clean |
| 4 | Minor token alias gaps; no invented primitives; lint clean or nits only |
| 3 | Some raw hex / one-off radius **or** near-duplicate of a registry control |
| 2 | Invented Button/Card/Dialog (or equivalent) outside `components/ui` |
| 1 | Tokens ignored; parallel style system |
| 0 | No `DESIGN.md` / tokens / registry — cannot judge adherence |

**Auto-fail (blocker → score ≤ 2):** invented canonical primitive listed in
registry; `var(--unknown-*)`; second `Button` export outside `components/ui`.

## A11y smoke (seat)

| Score | Meaning |
| --- | --- |
| 5 | lang set; controls labeled; focus-visible; contrast readable; reduced-motion respected |
| 4 | One minor miss (e.g. decorative icon without aria-hidden) — no keyboard trap |
| 3 | Missing focus ring **or** icon-only control without name |
| 2 | Submit-by-accident buttons (`type` missing) **or** contrast clearly broken |
| 1 | Keyboard / screen-reader path unusable on primary actions |
| 0 | No interactive surface to evaluate |

MVP mechanical cues (web-seed): `lang` on `<html>`, Button `type="button"`,
`focus-visible` styles — see eval `a11y-smoke` and `tools/ds-lint` a11y hints.

## Craft / anti-slop (seat)

Use [ANTI-SLOP.md](ANTI-SLOP.md). Depth tables live in `review-ui` STANDARDS.

| Score | Meaning |
| --- | --- |
| 5 | Intentional hierarchy; no AI-slop signatures; delete-before-polish applied |
| 4 | One nit (e.g. slight hero clutter) — still on-brand |
| 3 | Multiple slop tells (pill clusters, purple glow, card-everything) |
| 2 | Feels template / interchangeable brand after removing nav |
| 1 | Decorative noise dominates; primary job unclear |
| 0 | Unfinished / lorem / dead controls presented as done |

## Severity mapping

| Severity | Rule |
| --- | --- |
| **blocker** | Prevents ship; forces seat ≤ 2 or fails threshold |
| **should** | Fix before calling the surface “done” |
| **nit** | Optional polish; does not alone block ship |

## Aggregation

```
SHIP     ⟺  DS≥4 ∧ A11y≥4 ∧ Craft≥4 ∧ blockers=0
NO-SHIP  ⟺  otherwise
```

Order fixes: **DS blockers → a11y blockers → craft shoulds → nits**.
