# Context7 stack map — OpenDesigma

Pinned **library IDs** for the default web stack. Agents should pass these
`libraryId` values to Context7 `query-docs` (skip `resolve-library-id` when
possible) before codegen against unfamiliar APIs.

> Context7 free quota can exhaust under worker fan-out. Prefer Pro + project
> key for automated pipelines. Machine-readable twin: [`context7.json`](../context7.json).

## Core web (Must — MVP)

| Concern | Package / product | Context7 ID | Notes |
| --- | --- | --- | --- |
| App framework | Next.js | `/vercel/next.js` | App Router; pin major via `version` param |
| UI runtime | React | `/reactjs/react.dev` | Docs site index; fallback `/facebook/react` if needed |
| Styling | Tailwind CSS | `/tailwindlabs/tailwindcss` | v4 `@import "tailwindcss"` + `@theme` |
| TypeScript | TypeScript | `/microsoft/typescript` | Config / types only when unsure |

## Mobile path (Should — explicit Expo)

| Concern | Package / product | Context7 ID | Notes |
| --- | --- | --- | --- |
| App framework | Expo | `/expo/expo` | Seed: `examples/mobile-seed`; skill `scaffold-mobile` |
| UI runtime | React Native | `/facebook/react-native` | Prefer with Expo; query before RN APIs |
| Docs map | — | [`docs/mobile-path.md`](./mobile-path.md) | App Store / Play = **Later** |

## Seed companion libs (Should)

| Concern | Package | Context7 ID |
| --- | --- | --- |
| Accessible primitives | Base UI | `/mui/base-ui` (resolve if drift) |
| Toasts | Sonner | `/emilkowalski/sonner` |
| Drawers | Vaul | `/emilkowalski/vaul` |
| Motion | Motion | `/motiondivision/motion` |
| Charts | Recharts | `/recharts/recharts` |
| DnD | dnd kit | `/clauderic/dnd-kit` |

Confirm companion IDs with `resolve-library-id` once when adding a lib; then pin
here. Do not leave unresolved names in skills.

## Design & docs tooling

| Concern | Product | Context7 ID / path |
| --- | --- | --- |
| Context7 itself | Context7 MCP/SDK | `/upstash/context7` |
| DESIGN.md lint (optional) | Google design.md | resolve `@google/design.md` when used |

Internal DS (this repo’s `DESIGN.md` / tokens) is **not** on Context7 — read
local files (`examples/web-seed`, `examples/mobile-seed`) / future DS MCP.
Private Context7 source = v1 Should.

## Agent rule (copy into prompts / AGENTS.md)

```
Before generating code against Next, React, or Tailwind APIs:
1. Open docs/context7-stack.md (or context7.json)
2. query-docs with the pinned libraryId + a single-concept query
3. Prefer project components/ui and DESIGN.md over inventing UI
```

## Seed versions (informational)

As of the `examples/web-seed` lockfile:

| Lib | Version (approx) |
| --- | --- |
| next | 16.x |
| react / react-dom | 19.x |
| tailwindcss | 4.x |

Pass `version` to Context7 when the lockfile major matters.
