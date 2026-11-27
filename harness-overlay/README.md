# Harness overlay (mínimo)

OpenDesigma usa o [harness](https://github.com/douglaslpo/harness) como
**espinha de processo** (SDD, memória, bus, CodeGraph). As skills P0 neste repo
são o **pack de domínio** (design / protótipo / web) — não substituem
`/harness:propose` etc.

Este overlay é **documentação + instalação opcional**. Não altera o instalador
core do harness (listas hardcoded ficam para v1 skill-packs).

## Mapa SDD ↔ skills OpenDesigma

| Fase harness | Skill(s) OpenDesigma | Notas |
| --- | --- | --- |
| `explore` / investigator | `ask-desigma` | Router de intent de produto |
| `propose` | `prototype` (se look aberto), critérios visuais no design.md do change | HITL no taste |
| `apply` / implementer | `pick-stack`, `scaffold-web`, `figma-sync`, promote de `prototype` | Codegen com DS / Code Connect |
| `test` | smoke do app scaffoldado | — |
| `verify` | `break-ui`, `review-ui` | Gates visuais além de CA/CR texto |
| `review` / auditor | `review-ui` | Complementa checklist harness |
| `archive` / PR | `ship-preview` | Preview URL + PR; sem merge automático |
| Pós-sessão | `learn-taste` | `DESIGN.md` do workspace |

## Instalação opcional (Cursor)

No repo consumidor (ou neste monorepo):

```sh
# Skills OpenDesigma (projeto)
REPO_ROOT="$(pwd)"  # checkout opendesigma
mkdir -p .cursor/skills
for d in "$REPO_ROOT"/skills/*/; do
  ln -sfn "$d" ".cursor/skills/$(basename "$d")"
done
```

Skills `harness-*` continuam vindas do instalador global do harness
(`~/.cursor/skills/harness-*`). Os dois catálogos convivem.

## Contratos

1. **Briefing harness** pode apontar “rodar `break-ui` + `review-ui` antes do
   verify” nos critérios de aceite visuais.
2. **Artefatos:** plans/ e `DESIGN.md` no workspace; PNG/diff do kernel
   (`desigma-mcp`) quando houver canvas — paths no briefing (bus é texto-only).
3. **Ownership:** arquivos gerados por `scaffold-web` / promote entram no
   `memory.yaml` touched/owned como qualquer apply.
4. **Autopilot:** não encadear `prototype`/`learn-taste` sem HITL — taste nodes
   exigem humano.

## Non-goals deste overlay

- Patch em `lib/installer.js` do harness
- Sub-agentes novos (`harness-designer`, …) — later
- Artifact store binário — later
- Pack mobile (`scaffold-mobile`) — later
