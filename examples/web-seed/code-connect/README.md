# Code Connect stubs (web-seed)

Minimal Figma ↔ code bridge for agents. Prefer these imports over inventing UI.

| File | Role |
| --- | --- |
| [`registry.json`](./registry.json) | Agent-readable component map (`preferRegistry`) |
| [`../figma.config.json`](../figma.config.json) | Code Connect CLI include globs |
| [`../components/ui/*.figma.ts`](../components/ui/) | Template stubs (publish when a Figma URL exists) |

Flow: read `DESIGN.md` → read this registry → reuse `components/ui` → run
`/figma-sync` to align tokens/variables or fill real Figma URLs.

Full guide: [`docs/figma-code-connect.md`](../../../docs/figma-code-connect.md).
