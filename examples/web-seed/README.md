# OpenDesigma web seed

Minimal, buildable **Next.js (App Router) + Tailwind + DESIGN.md + tokens**
scaffold for agentic prototyping. Used by `scaffold-web` as the default shape
and by [`evals/`](../../evals/) as the DS-reuse / build-smoke fixture.

## Quick start

```sh
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```sh
pnpm build   # production smoke
pnpm lint
```

## Layout

| Path | Role |
| --- | --- |
| `DESIGN.md` | Agent-readable design grammar |
| `tokens.css` | Color / type / space / motion tokens |
| `app/` | App Router entry (`layout`, `page`, `globals.css`) |
| `components/ui/` | Thin DS primitives (`Button`, `Stack`) — **reuse these** |
| `AGENTS.md` | Pointer for coding agents |

## Design rules (short)

1. Read `DESIGN.md` before UI work.
2. Use `var(--color-*)` / Tailwind aliases — no one-off hex in components.
3. Do not invent a second Button; extend `components/ui/button.tsx`.

## Not included

Auth, database, mobile/Expo, Figma Code Connect. Those land in later packs.
