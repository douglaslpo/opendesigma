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

### Demo: prototype picker

```sh
pnpm install
pnpm dev
```

1. Open [http://127.0.0.1:3000/prototype](http://127.0.0.1:3000/prototype)
   (or click **Start prototype** on the home page).
2. Switch **Calm / Dense / Split** — the reservation preview updates.
3. Click **Usar variante …** to confirm the pick.

This is a minimal live version of the `/prototype` skill picker, reusing
`Button` + `Stack` and `DESIGN.md` tokens.

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
| `app/prototype/` | Interactive Calm/Dense/Split picker demo |
| `components/ui/` | Thin DS primitives (`Button`, `Stack`) — **reuse these** |
| `code-connect/` | Agent-readable Figma↔code registry (stubs) |
| `*.figma.ts` | Code Connect templates (excluded from `tsc`/Next) |
| `figma.config.json` | Code Connect CLI include globs |
| `AGENTS.md` | Pointer for coding agents |

## Design rules (short)

1. Read `DESIGN.md` before UI work.
2. Use `var(--color-*)` / Tailwind aliases — no one-off hex in components.
3. Do not invent a second Button; extend `components/ui/button.tsx`.

## Figma / Code Connect

Minimal bridge (Should): local registry + `.figma.ts` stubs. Fill real Figma
URLs and run `/figma-sync` / `npx figma connect publish` when a file exists.
Guide: [`docs/figma-code-connect.md`](../../docs/figma-code-connect.md).

## Not included

Auth, database, live Figma publish automation. Mobile/Expo lives in
[`../mobile-seed`](../mobile-seed/) (`docs/mobile-path.md`).
