# Token sync checklist — figma-sync

Use during Phase 2. Prefer **CSS custom properties** that already match
`DESIGN.md` / `tokens.css` in the OpenDesigma web seed.

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
