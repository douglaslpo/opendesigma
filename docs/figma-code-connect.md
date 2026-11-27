# Figma ↔ Code Connect — OpenDesigma

How to map **web-seed** (and scaffolded apps) components to Figma via
[Code Connect](https://developers.figma.com/docs/code-connect/), keep
`DESIGN.md` / tokens in sync, and feed agents with real imports instead of
hallucinated UI.

**Layer:** L2 grounding (blueprint Should). Complements Context7 (libs) and
the local DS (`DESIGN.md` + `components/ui`). Does **not** require an OD
daemon or egui chrome.

## Why it exists

Without Code Connect, Figma MCP / design-to-code paths tend to rebuild UI from
primitives. Official Figma evals (2026) showed that mapped components cut
median duration and tokens and raised quality. OpenDesigma rule:

> Prefer registry components. Never invent a second Button.

## Sources of truth (hybrid)

| Artifact | Role | Owner |
| --- | --- | --- |
| `DESIGN.md` | Agent-readable grammar + rationale | Repo |
| `tokens.css` (or JSON tokens) | Canonical color / type / space / motion | Repo |
| `components/ui/*` | Canonical React primitives | Repo |
| `code-connect/registry.json` | Agent-readable Figma↔code map (stub-friendly) | Repo |
| `*.figma.ts` | Code Connect **templates** (publish to Figma) | Repo |
| Figma variables | Design-side mirror of tokens | Figma file |
| Figma components | Visual instances linked by node URL | Figma file |

Repo wins for codegen. Figma wins for visual editing. Drift is fixed by
`figma-sync` (tokens → repo preferred direction in this slice).

## Minimal mapping recipe (web-seed)

Reference tree: [`examples/web-seed/`](../examples/web-seed/).

1. **List registry components** from `DESIGN.md` → Components and
   `components/ui/index.ts`.
2. **Record each mapping** in `code-connect/registry.json` (path, export,
   props, optional Figma URL / node id).
3. **Add a template stub** beside the component, e.g.
   `components/ui/button.figma.ts` (modern template API — preferred over
   legacy React parsers).
4. **Wire `figma.config.json`** at the app root (`include: ["**/*.figma.ts"]`).
5. **Align Figma variables** to `tokens.css` names (`color/canvas` ↔
   `--color-canvas`, …) via skill `figma-sync`.
6. **Publish** when a real Figma file exists:
   `npx figma connect publish` (needs Figma token / org seats).
7. **Verify agents** — design-to-code must import `@/components/ui/Button`,
   not invent styles.

Placeholder Figma URLs (`REPLACE_WITH_FIGMA_URL`) are fine until a file is
linked; keep the registry and templates so agents already prefer the DS.

### Template stub shape (`.figma.ts`)

```ts
// url=https://www.figma.com/design/FILE_KEY/Name?node-id=1-2
// source=components/ui/button.tsx
// component=Button
import figma from "figma";

const instance = figma.selectedInstance;
const label = instance.getString("Label");
const variant = instance.getEnum("Variant", {
  Primary: "primary",
  Ghost: "ghost",
});

export default {
  id: "button",
  imports: ['import { Button } from "@/components/ui"'],
  example: figma.code`<Button variant={${variant}}>${label}</Button>`,
};
```

Legacy `figma.connect()` React parsers still appear in older docs; new work
should use **template files**. See Figma’s template migration guide.

### Agent-readable registry

```json
{
  "version": 1,
  "preferRegistry": true,
  "components": [
    {
      "id": "button",
      "export": "Button",
      "source": "components/ui/button.tsx",
      "import": "import { Button } from \"@/components/ui\"",
      "figmaUrl": null,
      "props": {
        "variant": ["primary", "ghost"],
        "children": "string | ReactNode"
      }
    }
  ]
}
```

Agents read this **before** inventing UI. Skill `figma-sync` treats it as the
authoritative component map when Code Connect MCP maps are missing.

## DESIGN.md coupling

| DESIGN.md section | Code Connect / Figma |
| --- | --- |
| Color / Typography / Spacing / Motion | Variables + token sync |
| Components table | One registry row + optional `.figma.ts` per row |
| Craft anti-slop | Guidelines injected via MCP / `review-ui` |

When taste changes via `learn-taste`, update `DESIGN.md` **and** check whether
tokens or mapped props need a sync pass (`/figma-sync`).

## Agent workflow (happy path)

```
Frame or brief
  → ask-desigma
  → figma-sync          (tokens / registry / map coverage)
  → get_design_context  (Figma MCP) with Code Connect snippets when published
  → scaffold-web | app-flow
  → prefer components/ui from registry
  → break-ui → review-ui → ship-preview
```

Hard rules for agents:

1. Open `DESIGN.md` + `code-connect/registry.json` before UI codegen.
2. If a component id exists in the registry, **reuse it**.
3. If missing, stop and propose extending `components/ui` — do not invent.
4. Query Context7 for Next/React/Tailwind; never substitute Context7 for the DS.

## MCP tools (when Figma is connected)

| Need | Typical tool |
| --- | --- |
| Layout / snippet from a node | `get_design_context` |
| Existing Code Connect map | `get_code_connect_map` |
| Suggest mappings | `get_code_connect_suggestions` → `send_code_connect_mappings` |
| Variables on a node | `get_variable_defs` |
| Find DS assets | `search_design_system` |

Skill `figma-sync` orchestrates these; it does not replace reading local
registry files.

## Scaffold hook

`scaffold-web` should emit (minimal):

- `code-connect/registry.json` for seeded `Button` / `Stack`
- `figma.config.json`
- optional `*.figma.ts` stubs with `REPLACE_WITH_FIGMA_URL`
- `AGENTS.md` pointer to this doc + `figma-sync`

See [`skills/scaffold-web/SKILL.md`](../skills/scaffold-web/SKILL.md) and
[`skills/figma-sync/SKILL.md`](../skills/figma-sync/SKILL.md).

## Out of scope (this slice)

- Live bidirectional publish automation / CI secrets
- Full variable round-trip daemon
- Code-to-design canvas write-back (Should later)
- OD Open Design daemon / egui editor

## See also

- Seed example: [`examples/web-seed/code-connect/`](../examples/web-seed/code-connect/)
- Skill: [`skills/figma-sync/`](../skills/figma-sync/)
- Stack docs: [`docs/context7-stack.md`](context7-stack.md)
- Studio shell: [`docs/studio-shell.md`](studio-shell.md)
