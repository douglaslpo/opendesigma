# AGENTS.md — OpenDesigma mobile seed

**Before building or changing UI, read [`DESIGN.md`](./DESIGN.md).** Prefer
`tokens.ts` and `components/ui/*` over inventing styles or a second Button.
Mobile craft checklist: skill `mobile-feel`. Path overview:
[`docs/mobile-path.md`](../../docs/mobile-path.md).

## Stack

- Expo (~52) + React Native + TypeScript
- Design grammar: `DESIGN.md` + `tokens.ts` (aligned with web-seed `tokens.css`)
- Canonical UI: `components/ui` (`Button`, `Stack`)

## Docs (Context7)

Pinned IDs: [`docs/context7-stack.md`](../../docs/context7-stack.md)
(`/expo/expo`, `/facebook/react-native`). Resolve→query before codegen against
unfamiliar Expo/RN APIs.

## OpenDesigma skills

`ask-desigma` → `prototype` → `pick-stack` → **`scaffold-mobile`** (this seed)
→ **`mobile-feel`** → `break-ui` → `review-ui` → `ship-preview` → `learn-taste`.

## Non-goals

App Store / Play submit, EAS store pipeline, OD daemon, egui — **Later** /
out of scope for this seed.
