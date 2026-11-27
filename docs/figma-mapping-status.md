# Figma mapping status

Checked from `examples/web-seed/code-connect/registry.json` and the mobile
seed. No Figma file was authorized for this pass, and `figma connect publish`
was not run. A template stub is not a publish. `published` stays false until
there is a publish log.

| Surface | Export | Source | Template | figmaUrl | Status | Published |
| --- | --- | --- | --- | --- | --- | --- |
| web | Button | `components/ui/button.tsx` | `components/ui/button.figma.ts` (`REPLACE_WITH_FIGMA_URL`) | `null` | stub | no |
| web | Stack | `components/ui/stack.tsx` | `components/ui/stack.figma.ts` (`REPLACE_WITH_FIGMA_URL`) | `null` | stub | no |
| mobile | Button | `components/ui/button.tsx` | none | none | unmapped | no |
| mobile | Stack | `components/ui/stack.tsx` | none | none | unmapped | no |

Status words, from `skills/figma-sync/MAP.md`:

| Status | Meaning here |
| --- | --- |
| stub | Registry row and template exist. `figmaUrl` is null. |
| linked | `figmaUrl` is a real `https` URL. Still not published. |
| unmapped | No Code Connect registry on that surface. |
| published | Only with evidence from `figma connect publish`. Not this pass. |

Regenerate the machine report with:

```sh
node tools/ds-lint/ds-lint.mjs --json
```

The `figma` array on that JSON is the same classification. Linking or
publishing needs a file key and an explicit go-ahead.
