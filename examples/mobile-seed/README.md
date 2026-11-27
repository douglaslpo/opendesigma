# OpenDesigma mobile seed

Minimal **Expo + React Native + DESIGN.md + tokens** scaffold for the named
mobile path. Token semantics match [`../web-seed`](../web-seed/). Used by
`scaffold-mobile` and the light `mobile-path` eval.

**App Store / Play submit = Later** — see
[`docs/mobile-path.md`](../../docs/mobile-path.md).

## Quick start

Reproducible install uses the committed lockfile (npm 10, Node 22):

```sh
npm ci
npm run typecheck
npx expo export --platform android
npx expo start
```

Then open in Expo Go or an Android emulator. `npx expo export --platform ios` bundles the JS on any host; the iOS simulator itself needs macOS and Xcode. The web target (`w`) is not in this lockfile — Expo asks for `react-dom`, `react-native-web`, and `@expo/metro-runtime` before `expo export --platform web`.

The example buttons change on-screen state: **Start prototype** confirms the screen is running without the API, and **Read DESIGN.md** shows the touch rules. Press feedback is the opacity change plus an Android ripple. Text keeps the default font scaling and the screen scrolls, so enlarged type wraps instead of clipping. Safe area comes from `react-native-safe-area-context` (the React Native `SafeAreaView` is a no-op on Android).

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
