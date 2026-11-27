# UI & Craft Standards (OpenDesigma)

Cite these values in findings instead of approximating. Distilled for the
OpenDesigma craft bar; motion tables adapted from common design-engineering
practice (see repo `NOTICE` / skills attribution).

**Project `DESIGN.md` and tokens win** when they conflict with this file.

## Design system

| Check | Pass |
| --- | --- |
| Color | Tokens / CSS variables — no raw hex when tokens exist |
| Radius / space / type | From the scale; no one-off `13px` / `17px` |
| Components | Registry / existing primitives before inventing |
| Themes | Semantic tokens work in light and dark if both ship |

## Hierarchy & layout

- One primary action per view region.
- Promotional first viewport: brand, one headline, one support line, one CTA
  group, one dominant visual — no stat strips / schedule clutter in the hero.
- Cards only when they contain interaction; otherwise flatten.
- Real product/place imagery beats abstract purple gradients as the main idea.

## Spacing & type

- Use the project's spacing scale (4/8 or documented tokens).
- Line-length readable (~45–75ch for body).
- Don't clip diacritics with tight `line-height` + `overflow: hidden`.

## Interaction states

Every interactive control needs: default, hover (fine pointer), focus-visible,
disabled, and loading/empty where data-bound. Focus ring must be visible.

## Motion — should it animate?

| Frequency | Decision |
| --- | --- |
| 100+/day (keyboard, ⌘K toggle) | No animation |
| Tens/day | Remove or drastically reduce |
| Occasional (modal, drawer, toast) | Standard |
| Rare / first-time | Delight allowed |

Valid purposes: spatial consistency, state, feedback, explanation, avoid jarring
change. "Looks cool" on frequent UI is a fail.

## Easing & duration

- Enter/exit → **ease-out** (never ease-in on UI)
- On-screen move → ease-in-out · hover/color → ease · marquee → linear

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

| Element | Duration |
| --- | --- |
| Button press | 100–160ms |
| Tooltip / small popover | 125–200ms |
| Dropdown / select | 150–250ms |
| Modal / drawer | 200–500ms |

UI motion **under 300ms** except modals/drawers/sheets/toasts.

## Physicality & performance

- Never `scale(0)` — start `scale(0.9–0.97)` + opacity.
- Popovers scale from trigger (`transform-origin`); modals may stay centered.
- Prefer `transform` / `opacity`; avoid animating layout props (accordion
  measured-height excepted).
- No `transition: all`.

## Accessibility smoke

- `prefers-reduced-motion`: keep opacity/color, drop movement.
- Hover motion behind `@media (hover: hover) and (pointer: fine)`.
- Contrast: text vs background must remain readable on both themes.
- Icon-only buttons need accessible names.
- Don't trap focus incorrectly in custom overlays — use the stack's dialog
  primitive (`pick-stack`).

## Breakpoints

Verify at the **real container width**, ~**320px**, and the widest supported
layout. Zoom/font scaling at 200% should not destroy the layout.
