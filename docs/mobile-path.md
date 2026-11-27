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
  → break-ui → review-ui
  → ship-preview       (preview / PR; not store)
  → learn-taste
```

## Dev loop

```sh
cd examples/mobile-seed
npm install
npx expo start
```

Docs retrieval: Context7 IDs `/expo/expo` and `/facebook/react-native` in
[`context7-stack.md`](./context7-stack.md).

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
