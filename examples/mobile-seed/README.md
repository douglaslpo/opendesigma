# OpenDesigma mobile seed

Minimal **Expo + React Native + DESIGN.md + tokens** scaffold for the named
mobile path. Token semantics match [`../web-seed`](../web-seed/). Used by
`scaffold-mobile` and the light `mobile-path` eval.

**App Store / Play submit = Later** — see
[`docs/mobile-path.md`](../../docs/mobile-path.md).

## Quick start

```sh
npm install   # or pnpm / yarn
npx expo start
```

Then open in Expo Go, iOS Simulator, Android emulator, or `w` for web.

```sh
npm run typecheck
```

## Layout

| Path | Role |
| --- | --- |
| `DESIGN.md` | Agent-readable design grammar (mobile + shared tokens) |
| `tokens.ts` | Color / space / motion (mirrors web-seed `tokens.css`) |
| `App.tsx` | First-screen composition |
| `components/ui/` | Thin DS primitives (`Button`, `Stack`) — **reuse these** |
| `AGENTS.md` | Pointer for coding agents |

## Design rules (short)

1. Read `DESIGN.md` before UI work.
2. Import colors/spacing from `tokens.ts` — no one-off hex in components.
3. Do not invent a second Button; extend `components/ui/button.tsx`.
4. Hit targets ≥ 44×44; respect safe area (`mobile-feel`).

## Not included

Auth, database, EAS production / store pipeline, push notifications, payments.
