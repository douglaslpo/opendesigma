# Harness overlay (mínimo)

OpenDesigma usa o [harness](https://github.com/douglaslpo/harness) como
**espinha de processo** (SDD, memória, bus, CodeGraph). As skills P0 neste repo
são o **pack de domínio** (design / protótipo / web) — não substituem
`/harness:propose` etc.

Este overlay é **documentação + instalação opcional**. Não altera o instalador
core do harness (listas hardcoded ficam para v1 skill-packs).

## Mapa SDD ↔ skills OpenDesigma

| Fase | Skills | Decisão humana |
| --- | --- | --- |
| `explore` | `ask-desigma` (investigator) | Roteia; não promove sozinho |
| `propose` | `prototype` (look aberto) | Promote exige escolha humana |
| `apply` | `pick-stack`, `scaffold-web`, `scaffold-mobile`, `scaffold-backend`, `figma-sync`, promote de `prototype` | Promote só depois da escolha humana |
| `test` | smoke do app scaffoldado | Smoke não substitui o veredito humano |
| `verify` | `break-ui`, `review-ui`, `design-jury`, `mobile-feel` (Expo) | Correção do `break-ui` exige humano |
| `review` | `review-ui`, `design-jury` (auditor) | Veredito do jury permanece humano |
| `archive` | `ship-preview` (+ round-trip) | Sem merge automático |

`verify` usa `tools/ds-lint` ([`docs/design-jury.md`](../docs/design-jury.md)).
`archive` entrega URL de preview e PR; sem merge automático
([`docs/round-trip.md`](../docs/round-trip.md)). Pós-sessão: `learn-taste`
grava `DESIGN.md` só com aprovação humana.

## Instalação opcional (Cursor)

No repo consumidor (ou neste monorepo):

Unix (macOS / Linux), a partir do checkout:

```sh
REPO_ROOT="$(pwd)"
mkdir -p .cursor/skills
for d in "$REPO_ROOT"/skills/*/; do
  ln -sfn "$d" ".cursor/skills/$(basename "$d")"
done
```

Windows (PowerShell). Symlink pede Modo de Desenvolvedor ou terminal elevado:

```powershell
New-Item -ItemType Directory -Force -Path .cursor\skills | Out-Null
Get-ChildItem skills -Directory | ForEach-Object {
  $link = Join-Path .cursor\skills $_.Name
  if (Test-Path $link) { Remove-Item $link -Force }
  New-Item -ItemType SymbolicLink -Path $link -Target $_.FullName
}
```

Sem symlink, copie: `Copy-Item -Recurse -Force skills\* .cursor\skills\`.

Skills `harness-*` continuam vindas do instalador global do harness
(`~/.cursor/skills/harness-*` no Unix; `%USERPROFILE%\.cursor\skills\harness-*`
no Windows). Os dois catálogos convivem.

## Contratos

1. **Briefing harness** pode apontar “rodar `break-ui` + `review-ui` +
   `design-jury` (com `ds-lint`) antes do verify” nos critérios de aceite
   visuais.
2. **Artefatos:** plans/ e `DESIGN.md` no workspace; PNG/diff do kernel
   (`desigma-mcp`) quando houver canvas — paths no briefing (bus é texto-only).
3. **Ownership:** arquivos gerados por `scaffold-web` / `scaffold-mobile` /
   `scaffold-backend` / promote entram no `memory.yaml` touched/owned como
   qualquer apply.
4. **Autopilot:** não encadear `prototype`/`learn-taste` sem HITL — taste nodes
   exigem humano.

## Non-goals deste overlay

- Patch em `lib/installer.js` do harness
- Sub-agentes novos (`harness-designer`, …) — later
- Artifact store binário — later
- Store pipeline mobile (EAS submit / App Store) — later (path Expo: `docs/mobile-path.md`)
- Auth/DB produto completo — later (path API opcional: `docs/backend-path.md`)
