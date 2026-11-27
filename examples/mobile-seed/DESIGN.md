# DESIGN.md — OpenDesigma mobile seed

Agent-readable design grammar for the **Expo / React Native** path.
Semantic tokens match [`examples/web-seed`](../web-seed/) (`tokens.css`).
Before building or changing UI, read this file and prefer
`components/ui` + `tokens.ts` over inventing chrome.

## Surfaces

| Surface | Role |
| --- | --- |
| Canvas | Cool mist background (`color.canvas`); one composition per screen |
| Ink | Primary text and brand mark (`color.ink`) |
| Accent | Single action hue (`color.accent`) — primary presses |
| Quiet | Secondary text / borders (`color.quiet`, `color.line`) |

## Color

Same restrained cool palette as web-seed — not purple-on-white, not cream+terracotta.

| Token | Value | Use |
| --- | --- | --- |
| `color.canvas` | `#e6eef3` | Screen background |
| `color.surface` | `#f7fafc` | Raised panels only when interaction needs them |
| `color.ink` | `#132029` | Headings, body |
| `color.quiet` | `#4a5d6a` | Supporting copy |
| `color.accent` | `#0c7c72` | Primary CTA |
| `color.accentInk` | `#f4fffc` | Text on accent |
| `color.line` | `#c5d4de` | Hairlines / focus rings |

Do **not** invent hex values in components — import from `tokens.ts`.

Shared values mirror `examples/web-seed/tokens.css`, which is the canonical
source. Platform exceptions (type faces, ease curve, px versus rem, button
padding) are in [`docs/token-semantics.md`](../../docs/token-semantics.md).
This seed has no Code Connect registry; those components stay unmapped until
a Figma file is authorized.

## Typography

| Role | Notes |
| --- | --- |
| Display / brand | Soft emphasis; brand-first on first screen |
| Body | System / readable RN default |
| Code | Monospace for paths/tokens |

Avoid Inter / Roboto as the *hero* brand face when a custom face is loaded.

## Spacing

Base unit `4px` (`space` in `tokens.ts`):

`1` 4 · `2` 8 · `3` 12 · `4` 16 · `6` 24 · `8` 32 · `12` 48 · `16` 64

First screen: brand, one headline, one sentence, one CTA group — nothing else.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `motion.fastMs` | `140` | Press feedback |
| `motion.medMs` | `280` | Enter / screen reveal |

Keep motion intentional (2–3 moments). No decorative bounce loops.
Prefer platform-native feedback (opacity on press) over heavy gesture theater.

## Touch

- Hit targets ≥ 44×44 pt for primary actions.
- Safe-area insets on notches / home indicators.
- Thumb-friendly primary CTA (lower third when scrolling is expected).
- No hover-only affordances; use press states.
- See skill `mobile-feel` for the full checklist.

## Components

Canonical UI lives under `components/ui/`. Reuse before inventing.

| Component | Path | Job |
| --- | --- | --- |
| `Button` | `components/ui/button.tsx` | Primary / ghost actions (`Pressable`) |
| `Stack` | `components/ui/stack.tsx` | Vertical rhythm with token gaps |

Hard rule: **do not invent a second Button**. Extend the existing one or open
an issue / `learn-taste` note.

## Craft anti-slop (minimum)

- No card grid in the first screen.
- No floating badges on media.
- No emoji as decoration.
- Prefer one accent; don't rainbow the screen.

## Out of scope (this seed)

App Store / Play submit pipeline, EAS production profiles, push, deep IAP —
see [`docs/mobile-path.md`](../../docs/mobile-path.md) (**Later**).
