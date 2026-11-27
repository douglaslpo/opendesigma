# Token sync checklist — figma-sync

Use during Phase 2. Prefer **CSS custom properties** that already match
`DESIGN.md` / `tokens.css` in the OpenDesigma web seed.

`examples/web-seed/tokens.css` is the canonical source.
`examples/mobile-seed/tokens.ts` mirrors shared color, space, and motion.
Native exceptions (`type-faces`, `ease-curve`, `space-unit`, `button-padding`)
are listed in [`docs/token-semantics.md`](../../docs/token-semantics.md).
`node tools/ds-lint/ds-lint.mjs` fails on undeclared drift. Mapping status
(stub / linked / unmapped, never published without evidence) is in
[`docs/figma-mapping-status.md`](../../docs/figma-mapping-status.md).

## Suggested name map

| Repo token | Suggested Figma variable | Kind |
| --- | --- | --- |
| `--color-canvas` | `color/canvas` | COLOR |
| `--color-surface` | `color/surface` | COLOR |
| `--color-ink` | `color/ink` | COLOR |
| `--color-quiet` | `color/quiet` | COLOR |
| `--color-accent` | `color/accent` | COLOR |
| `--color-accent-ink` | `color/accent-ink` | COLOR |
| `--color-line` | `color/line` | COLOR |
| `--space-1` … `--space-16` | `space/1` … `space/16` | FLOAT |
| `--motion-fast` | `motion/fast` | STRING or FLOAT (ms) |
| `--motion-med` | `motion/med` | STRING or FLOAT (ms) |
| `--ease-out` | `motion/ease-out` | STRING |
| `--font-display` | `font/display` | STRING |
| `--font-sans` | `font/sans` | STRING |
| `--font-mono` | `font/mono` | STRING |

## Rules

1. Do not invent hex in components — only update token files / DESIGN.md tables.
2. On conflict, show both values; default keep **repo** unless the brief says
   design leads.
3. Motion should stay intentional (2–3 moments); do not import decorative
   bounce tokens from Figma kits.
4. After writes, remind agents: Tailwind theme aliases must still resolve
   (`bg-canvas`, `text-ink`, …).
