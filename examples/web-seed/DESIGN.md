# DESIGN.md — OpenDesigma web seed

Agent-readable design grammar for this seed. Prefer tokens and
`components/ui` over inventing chrome. Before building or changing UI,
read this file.

## Surfaces

| Surface | Role |
| --- | --- |
| Canvas | Cool mist background (`--color-canvas`); one composition per viewport |
| Ink | Primary text and brand mark (`--color-ink`) |
| Accent | Single action hue (`--color-accent`) — links, primary buttons |
| Quiet | Secondary text / borders (`--color-quiet`, `--color-line`) |

## Color

Restrained cool palette — not purple-on-white, not cream+terracotta.

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#e6eef3` | Page background |
| `--color-surface` | `#f7fafc` | Raised panels only when interaction needs them |
| `--color-ink` | `#132029` | Headings, body |
| `--color-quiet` | `#4a5d6a` | Supporting copy |
| `--color-accent` | `#0c7c72` | Primary CTA |
| `--color-accent-ink` | `#f4fffc` | Text on accent |
| `--color-line` | `#c5d4de` | Hairlines / focus rings |

Do **not** invent hex values in components — use `var(--color-*)` or the
Tailwind theme aliases (`bg-canvas`, `text-ink`, `bg-accent`, …).

`tokens.css` is the canonical source for web and for the mobile mirror.
Shared color, space, and motion must match `examples/mobile-seed/tokens.ts`.
Type faces, the ease curve, rem versus px, and button padding are the native
exceptions in [`docs/token-semantics.md`](../../docs/token-semantics.md).

## Typography

| Role | Token / face | Notes |
| --- | --- | --- |
| Display / brand | `--font-display` (Fraunces) | Soft serif; brand-first on landing |
| Body | `--font-sans` (Source Sans 3) | Readable UI copy |
| Code | `--font-mono` (Source Code Pro) | Paths, tokens |

Avoid Inter / Roboto / Arial as the hero face.

## Spacing

Base unit `4px`. Prefer the scale:

`1` 4 · `2` 8 · `3` 12 · `4` 16 · `6` 24 · `8` 32 · `12` 48 · `16` 64

Landing hero: brand, one headline, one sentence, one CTA group — nothing else
in the first viewport.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--motion-fast` | `140ms` | Hover / focus |
| `--motion-med` | `280ms` | Enter / section reveal |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default exit curve |

Keep motion intentional (2–3 moments). No decorative bounce loops.
Honor `prefers-reduced-motion`: keep color, drop movement.

## Components

Canonical UI lives under `components/ui/`. Reuse before inventing.
Agent-readable Figma map: [`code-connect/registry.json`](./code-connect/registry.json)
(see [`docs/figma-code-connect.md`](../../docs/figma-code-connect.md)).

| Component | Path | Code Connect stub | Job |
| --- | --- | --- | --- |
| `Button` | `components/ui/button.tsx` | `button.figma.ts` | Primary / ghost actions |
| `Stack` | `components/ui/stack.tsx` | `stack.figma.ts` | Vertical rhythm with token gaps |

`app/ds-review` is the jury bench (extreme copy, empty / error / loading).
It reuses `Button` and `Stack`. It is not a second component. Figma publish
status: [`docs/figma-mapping-status.md`](../../docs/figma-mapping-status.md).

Hard rule: **do not invent a second Button**. Extend the existing one or open
an issue / `learn-taste` note. Sync Figma variables ↔ tokens with
`/figma-sync`.

## Craft anti-slop (minimum)

- No card grid in the hero.
- No floating badges on media.
- No emoji as decoration.
- Prefer one accent; don't rainbow the page.
