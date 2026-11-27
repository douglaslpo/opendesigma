# Quickstart OpenDesigma

Guia curto para usar o OpenDesigma no **Cursor**: skills, Context7, preview
host, seeds web/mobile/API, fluxo `ask-desigma`, Design Jury / DS lint,
round-trip preview→PR e a **ordem canônica** das skills.

Shell do Studio = **Cursor-centric + preview host** (Opção A). Sem daemon
estilo Open Design e sem chrome egui. Detalhes:
[`studio-shell.md`](studio-shell.md).

## Pré-requisitos

| Peça | Quando precisa |
| --- | --- |
| [Cursor](https://cursor.com) (ou outro host Agent Skills) | Sempre para o loop de skills |
| Node **20+** | web-seed, preview host, evals, ds-lint |
| **pnpm** | `examples/web-seed`, `examples/api-seed` |
| **npm** + Expo CLI | `examples/mobile-seed` |
| MCP **Context7** | Docs de libs antes de codegen |
| Rust (toolchain em `rust-toolchain.toml`) | Só se for buildar o kernel / MCP headless |

Clone:

```sh
git clone https://github.com/douglaslpo/opendesigma.git
cd opendesigma
```

## 1. Instalar as skills no Cursor

As skills vivem em [`skills/`](../skills/). Instale por symlink no projeto
(recomendado enquanto o catálogo evolui):

```sh
mkdir -p .cursor/skills
for d in skills/*/; do
  ln -sfn "$(pwd)/$d" ".cursor/skills/$(basename "$d")"
done
```

Ou, quando publicado no registry:

```sh
npx skills@latest add douglaslpo/opendesigma
```

Várias skills P0 usam `disable-model-invocation: true` — **invoque
explicitamente** (`/ask-desigma`, `/prototype`, …). Catálogo completo:
[`skills/README.md`](../skills/README.md).

## 2. Context7 (docs antes de codegen)

Mapa pinado: [`context7-stack.md`](context7-stack.md) · máquina:
[`context7.json`](../context7.json).

**Regra:** antes de gerar código contra Next / React / Tailwind / Expo / RN:

1. Abra o mapa (ou `context7.json`).
2. Chame `query-docs` com o `libraryId` pinado + uma query de um conceito.
3. Prefira `components/ui` + `DESIGN.md` do projeto a inventar UI.

IDs essenciais:

| Stack | Context7 ID |
| --- | --- |
| Next.js | `/vercel/next.js` |
| React | `/reactjs/react.dev` |
| Tailwind | `/tailwindlabs/tailwindcss` |
| Expo | `/expo/expo` |
| React Native | `/facebook/react-native` |

DS interno (`DESIGN.md` / tokens) **não** está no Context7 — leia os arquivos
locais do seed. Cota free esgota com fan-out de workers; pipelines
automatizados preferem Pro + key de projeto.

## 3. Preview host (porta 4173)

Host estático mínimo para `ship-preview` / HTML de `prototype`. Spec:
[`preview-host.md`](preview-host.md).

```sh
node packages/preview-host/bin/preview-host.mjs --root packages/preview-host/public
# → http://127.0.0.1:4173/   ·   GET /healthz → {"ok":true,…}
```

| Item | Default |
| --- | --- |
| URL | `http://127.0.0.1:4173/` |
| Porta | `4173` (`OD_PREVIEW_PORT`) |
| Auth | Opcional (`OD_PREVIEW_TOKEN` / Bearer ou `?token=`) |

Aponte `--root` para `out/` (export Next), HTML de protótipo ou
`.opendesigma/preview/`. O host **não** faz HMR — dev interativo continua em
`pnpm dev` (porta 3000).

## 4. Web seed

Default greenfield de `scaffold-web`: Next App Router + Tailwind +
`DESIGN.md` + `tokens.css` + `components/ui`.

```sh
cd examples/web-seed
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
```

Leia `DESIGN.md` (e Code Connect, se houver Figma) **antes** de UI nova.
Bridge Figma: [`figma-code-connect.md`](figma-code-connect.md).

## 5. Mobile seed (Expo)

Path nomeado — mesmos tokens semânticos do web-seed (`tokens.ts`).
**App Store / Play = Later.** Guia: [`mobile-path.md`](mobile-path.md).

```sh
cd examples/mobile-seed
npm install
npx expo start
```

Skills: `/scaffold-mobile` → `/mobile-feel` (touch, safe area, feel nativo).

## 6. API seed (backend opcional)

Path **Should** — default do produto continua **só-UI**. Stubs Next
`GET /api/health` + `POST /api/echo`. Guia: [`backend-path.md`](backend-path.md).

```sh
cd examples/api-seed
pnpm install
pnpm dev
curl -s http://127.0.0.1:3000/api/health
```

Skill: `/scaffold-backend` (Hono = opt-in separado). Auth/DB produto = Later.

## 7. Fluxo `ask-desigma`

Comece incerto? Invoque **`/ask-desigma`**. O router escolhe **uma** skill (ou
sequência curta), explica em uma frase e nomeia a seguinte — sem despejar o
catálogo.

| Você diz | Skill |
| --- | --- |
| “Por onde começo?” / goal vago | `ask-desigma` |
| “Me dá opções de look” | `prototype` |
| “Qual lib?” | `pick-stack` |
| “Cria o app Next” | `scaffold-web` |
| “Cria o app Expo” | `scaffold-mobile` |
| “API / backend / health” | `scaffold-backend` |
| “Parece web no celular” | `mobile-feel` |
| “Figma / Code Connect” | `figma-sync` |
| “Stress com dados ruins” | `break-ui` |
| “Review a UI” | `review-ui` |
| “Passa no jury?” | `design-jury` |
| “Manda preview / PR” | `ship-preview` |
| “Grava o taste” | `learn-taste` |

## 8. Design Jury + DS lint

Gate de qualidade antes de chamar “pronto”. Spec:
[`design-jury.md`](design-jury.md).

```
break-ui → review-ui → design-jury → ship-preview
                 ↘ ds-lint (mecânico)
```

```sh
# Lint mecânico (tokens inválidos / componentes inventados)
node tools/ds-lint/ds-lint.mjs

# Evals MVP (inclui ds-lint; use --skip-build se não precisar buildar)
cd examples/web-seed && pnpm install && cd ../..
node evals/run.mjs --skip-build
```

Veredito ship: **DS ≥ 4**, **A11y ≥ 4**, **Craft ≥ 4**, **zero blockers**.
Blockers do lint falham o assento DS automaticamente. Skill: `/design-jury`.

## 9. Ordem canônica das skills

```
ask-desigma
  → prototype              (+ picker / promote)
  → pick-stack
  → scaffold-web | scaffold-mobile
  → scaffold-backend       (opcional — API stubs)
  → mobile-feel            (só Expo / RN)
  → figma-sync             (quando Figma / mapa DS importa)
  → break-ui → review-ui → design-jury
  → ship-preview           (host :4173 e/ou PR + round-trip)
  → learn-taste            → DESIGN.md
```

Pulinhos válidos: se o look já está fechado, pule `prototype`; se o app já
existe, pule scaffold; se não precisa de API, pule `scaffold-backend`; se não
há Figma, pule `figma-sync`. Não pule os gates quando o pedido for “pronto
para ship”. Round-trip leve: [`round-trip.md`](round-trip.md).

Mapa no harness SDD: [`harness-overlay/README.md`](../harness-overlay/README.md).

## Checklist de 10 minutos

1. Clonar o repo e symlinks das skills (seção 1).
2. Confirmar MCP Context7 + mapa pinado (seção 2).
3. `pnpm install && pnpm dev` em `examples/web-seed` **ou** `npx expo start`
   em `examples/mobile-seed` (API opcional: seção 6).
4. Subir o preview host na **4173** e bater `/healthz`.
5. No Cursor: `/ask-desigma` → seguir a skill sugerida.
6. Antes de ship: `node tools/ds-lint/ds-lint.mjs` + `/design-jury`.
7. `/ship-preview` com URL `http://127.0.0.1:4173/` (+ PR se promove).

## Próximos links

| Doc | Conteúdo |
| --- | --- |
| [`skills/README.md`](../skills/README.md) | Catálogo + install |
| [`preview-host.md`](preview-host.md) | Porta, auth, fluxo ship |
| [`round-trip.md`](round-trip.md) | Promote preview → commit/PR |
| [`context7-stack.md`](context7-stack.md) | IDs de libs |
| [`mobile-path.md`](mobile-path.md) | Expo; store = Later |
| [`backend-path.md`](backend-path.md) | API opcional; UI-only default |
| [`design-jury.md`](design-jury.md) | Jury + ds-lint |
| [`figma-code-connect.md`](figma-code-connect.md) | Bridge Figma |
| [`evals/README.md`](../evals/README.md) | Checks determinísticos |
| README raiz | Kernel, MCP, licença |
