---
name: ask-desigma
description: >
  Router OpenDesigma — escolhe qual skill ou sequência curta encaixa no pedido
  (ideia → protótipo → scaffold → gates → ship → taste). Use when the user is
  unsure which skill to run, asks "what should I do next?", "por onde começo?",
  or names a vague design/build/preview goal. For a known skill, invoke that
  skill directly. Não lista o catálogo inteiro de volta.
disable-model-invocation: true
layer: router
surfaces: [both]
artifacts: [plan]
---

# Ask Desigma

Antes de afirmar o que uma skill faz ou recomendar, **leia o `SKILL.md` alvo**
— os resumos abaixo são só orientação. Recomende **uma** skill (ou uma
sequência curta), diga o porquê em uma frase e nomeie a skill seguinte.
Não devolva o mapa inteiro.

Um **flow** é um caminho pelas skills. A maior parte do trabalho de UI/produto
percorre o **main flow** (ideia → ship). Há **gates** de qualidade, **upkeep**
em codebase existente e o **router** (esta skill).

## Main flow: idea → ship

1. **Não sabe como deve parecer?** → **`prototype`**. Várias direções
   genuinamente diferentes atrás de um picker; promote explícito da vencedora.

2. **Stack / deps?** → **`pick-stack`** antes de reinventar toast, drawer,
   primitives, charts, etc. Preferir o que já está no repo + catálogo OpenDesigma.

3. **App/site ainda não existe (ou greenfield web)?** → **`scaffold-web`**.
   Next.js + React + Tailwind + `DESIGN.md`/tokens como default do produto.

4. **App mobile / Expo / RN?** → **`scaffold-mobile`** (seed
   `examples/mobile-seed`). Depois **`mobile-feel`**. App Store/Play = Later
   (`docs/mobile-path.md`).

5. **Figma / Code Connect / tokens↔variables / mapear DS?** → **`figma-sync`**.
   Registry + stubs; preferência obrigatória por `components/ui`.

6. **Quebrar com dados ruins** → **`break-ui`** (worst-case + toggle).

7. **Review de craft/UI** → **`review-ui`** (default a flaggar; aprovação se ganha).
   Em telas Expo, rode também **`mobile-feel`**.

8. **Gate de qualidade / “passa no jury?”** → **`design-jury`** (DS + a11y +
   anti-slop scorecard; rode `tools/ds-lint` como evidência). Depois de
   `break-ui` / `review-ui` quando o pedido for veredito ship/no-ship.

9. **Preview compartilhável / PR / promote** → **`ship-preview`**.

10. **Fechar a sessão de taste** → **`learn-taste`** → regras em `DESIGN.md`
    (só com aprovação humana).

Orquestrado (harness / worker sem humano no chat): pule o quiet-gate das skills
filhas e vá direto à Phase 1; preserve propose-then-stop nos nós de taste
(`prototype` promote, `learn-taste` write, `break-ui` fix).

## Gates (antes de chamar “pronto”)

| Sintoma | Skill |
| --- | --- |
| Layout explode com nomes longos / lista vazia / RTL | `break-ui` |
| UI “funciona” mas parece slop / tokens errados / a11y fraca | `review-ui` |
| Precisa de veredito ship/no-ship / score DS+a11y+craft | `design-jury` |
| Tokens inválidos / componente inventado (lint mecânico) | `design-jury` + `tools/ds-lint` |
| Mobile parece “site no celular” / hit target / safe area | `mobile-feel` |
| Precisa de link/preview/PR para stakeholder | `ship-preview` |

## Upkeep (codebase que já existe)

| Pergunta | Skill |
| --- | --- |
| Preferências da sessão sumiram? | `learn-taste` |
| Stack inconsistente / lib inventada? | `pick-stack` |
| Drift Figma ↔ tokens / componentes sem map? | `figma-sync` |
| Feel nativo Expo / RN fraco? | `mobile-feel` |
| Preview stale / precisa re-ship | `ship-preview` |

(Triad find-polish / audit-craft / remove-clutter e pack motion = later.
Store pipeline mobile = Later — ver `docs/mobile-path.md`.)

## Situações comuns

| Você diz | Reach for |
| --- | --- |
| "Me dá umas opções" / "não sei o look" | `prototype` |
| "Qual lib usar?" / "não reinventa toast" | `pick-stack` |
| "Cria o app Next" / "scaffolda o projeto" | `scaffold-web` |
| "Cria o app Expo" / "scaffold mobile" / "React Native" | `scaffold-mobile` |
| "Parece web no celular" / "hit target" / "safe area" | `mobile-feel` |
| "Figma" / "Code Connect" / "sincroniza tokens" | `figma-sync` |
| "Tenta o pior caso" / "stress test" | `break-ui` |
| "Isso tá bom?" / "review a UI" | `review-ui` |
| "Design Jury" / "passa no jury?" / "quality gate" | `design-jury` |
| "Manda preview" / "abre PR" / "ship" | `ship-preview` |
| "Para de repetir esse erro" / "grava o taste" | `learn-taste` |
| "Por onde começo?" | `ask-desigma` (esta) → depois a skill acima |

## Contrato com o harness

Quando o ciclo SDD do harness estiver ativo (`propose` → `apply` → …):

- **Brief / specs / critérios visuais** → proposer; depois `prototype` se o look
  ainda for aberto.
- **Implementação de tasks de código** → implementer; builders
  (`pick-stack`, `scaffold-web`, `scaffold-mobile`) alimentam o escopo.
- **Verify / review** → validator/auditor + gates `break-ui` / `review-ui` /
  `design-jury` (lint `tools/ds-lint`).
- **Archive / PR** → `ship-preview` + fluxo harness de PR.

Ver `harness-overlay/README.md` no repo OpenDesigma.
