# Shell do Studio — decisão

**Status:** decidido — **Opção A** (2026-11-27, America/Sao_Paulo)  
**Blueprint:** passo 6 — Cursor-centric vs daemon web vs egui.

## Escolha

**A. Cursor-centric + preview host**

- Cursor (e CLIs compatíveis) como shell de agentes / skills / MCP.
- Preview compartilhável via host estático leve (`packages/preview-host`).
- Sem UI egui Desigma; sem monólito tipo Open Design no MVP.

| Opção | Veredito MVP |
| --- | --- |
| A. Cursor + preview host | **Adotada** |
| B. Web daemon fino (OD-like) | Adiada — só se share/collab exigir |
| C. Desktop egui | Fora — baixa alavancagem para criar apps |

## Implicações

1. Spec e implementação do preview host: [`preview-host.md`](preview-host.md).
2. Skills `ship-preview` e `prototype` apontam para o host.
3. Não investir em chrome egui nem daemon completo até evals de DS adherence estabilizarem.

## Referência no Project store

Espelho da análise/decisão: `docs/studio-shell-decision.md` no Agent Store do Project OpenDesigma.
