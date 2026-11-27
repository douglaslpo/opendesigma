# Mobile path — Expo (explicit)

OpenDesigma names **Expo / React Native** as the mobile creation path — not
marketing filler. Web remains the MVP default; mobile is a **Should / light
Later** pack: scaffold + feel + shared DS grammar. **App Store / Play submit
pipelines are Later.**

## What ships now

| Piece | Path / skill | Role |
| --- | --- | --- |
| Seed | [`examples/mobile-seed/`](../examples/mobile-seed/) | Minimal Expo app + `DESIGN.md` + `tokens.ts` |
| Scaffold | [`skills/scaffold-mobile`](../skills/scaffold-mobile/) | Greenfield Expo with DS hooks |
| Feel gate | [`skills/mobile-feel`](../skills/mobile-feel/) | Touch / safe area / press checklist |
| Router | `ask-desigma` | Routes “app mobile / Expo” → scaffold-mobile |
| Stack pick | `pick-stack` | Points mobile asks here; web libs stay web |

Tokens in the seed **mirror** [`examples/web-seed/tokens.css`](../examples/web-seed/tokens.css)
(same semantic colors / space / motion). Agents must not invent a second palette.

## Happy path

```
ask-desigma
  → prototype          (optional — look still open)
  → pick-stack         (confirm Expo, not Next)
  → scaffold-mobile    (or copy examples/mobile-seed)
  → mobile-feel
  → break-ui → review-ui → design-jury
  → ship-preview       (preview / PR; not store)
  → learn-taste
```

## Dev loop

```sh
cd examples/mobile-seed
npm ci          # lockfile — reproducible; npm install only to refresh it
npm run typecheck
npx expo export --platform android   # Hermes/JS bundle, no device required
npx expo start
```

`npx expo export --platform ios` also emits a JS bundle on Linux. Running that
bundle in the iOS Simulator needs macOS and Xcode; that check is separate from
the Android export. `expo-asset` is a direct dependency (and an app plugin)
because Metro's export refuses to start without it.

The seed screen is UI-only. The two example actions update visible state
(prototype started, or a DESIGN.md excerpt). They do not call the API.

Docs retrieval: Context7 IDs `/expo/expo` and `/facebook/react-native` in
[`context7-stack.md`](./context7-stack.md). Safe area uses
`react-native-safe-area-context` at the version `npx expo install` pins for
this SDK — not the React Native `SafeAreaView`, which does not inset Android.

## Explicitly Later

- EAS Build production profiles + store credentials
- App Store Connect / Google Play submit automation
- Push, IAP, TestFlight/Play track orchestration
- Full parity with web Code Connect / Figma bridge on RN components

Feeling native (`mobile-feel`) ≠ store-ready.

## Non-goals

- egui / Desigma desktop chrome
- Open Design daemon as mobile preview host
- Claiming “ship to stores” in MVP copy

## Related

- Web default: [`examples/web-seed/`](../examples/web-seed/), `scaffold-web`
- Studio shell: [`studio-shell.md`](./studio-shell.md) (Cursor-centric)
- Blueprint: mobile pack = v1 Should; store pipeline = Later
