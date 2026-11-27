# Component map schema — figma-sync

`code-connect/registry.json` is the **offline / agent-first** map. Published
Code Connect (`.figma.ts` → Figma) is the **online** map for MCP Dev Mode.

## registry.json

```json
{
  "version": 1,
  "preferRegistry": true,
  "designMd": "DESIGN.md",
  "tokens": "tokens.css",
  "components": [
    {
      "id": "button",
      "export": "Button",
      "source": "components/ui/button.tsx",
      "import": "import { Button } from \"@/components/ui\"",
      "figmaUrl": null,
      "template": "components/ui/button.figma.ts",
      "props": {
        "variant": ["primary", "ghost"],
        "children": "ReactNode"
      },
      "notes": "Canonical CTA — never invent a second Button"
    }
  ]
}
```

### Field rules

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable kebab/camel id for agents |
| `export` | yes | Symbol name in code |
| `source` | yes | Repo-relative path |
| `import` | yes | Exact import agents should emit |
| `figmaUrl` | no | `null` until a real node link exists |
| `template` | no | Path to `.figma.ts` stub |
| `props` | no | Design↔code prop contract |
| `notes` | no | Guidelines (a11y, variants) |

`preferRegistry: true` means codegen **must** reuse listed components.

## Template files

- Prefer `*.figma.ts` (template API).
- Header comments: `url`, optional `source`, optional `component`.
- `imports` must match registry `import`.
- Prop names in `getString` / `getEnum` / `getBoolean` should match the Figma
  component property panel when a live file exists.

## Coverage heuristic

| State | Meaning |
| --- | --- |
| Stub | registry row + template; `figmaUrl` null |
| Linked | `figmaUrl` set; not necessarily published |
| Published | `figma connect publish` succeeded; MCP returns snippets |

Report coverage as stub/linked/published counts — never claim published
without evidence.
