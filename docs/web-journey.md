# Jornada web e procedência

Fixture ponta a ponta do briefing fictício **Ateliê Lume**. Dois runtimes,
de propósito:

| Modo | Onde | O que serve |
| --- | --- | --- |
| Preview estático | `fixtures/web-journey/static` no preview host | Artefato dedicado (HTML, CSS, JS, SVG) |
| Next interativo | `examples/web-seed` rota `/briefing` | `pnpm dev` ou `pnpm start` |

O host estático não executa a rota Next. Um endereço em `127.0.0.1` ou
`localhost` é local. Preview implantado só entra no manifesto como URL
pública; esta fixture não publica uma.

## O que a jornada mostra

Fila fictícia com filtro (Todos, Em espera, Em revisão, Bloqueados, Arquivo).
Arquivo não tem itens: esse filtro é o estado vazio. Carregamento e falha são
estados simulados, sem backend. Três direções com eixos diferentes:

| Variante | Eixo | Quando cabe |
| --- | --- | --- |
| Quiet | editorial, esparso, leitura de um | Briefing que pede calma |
| Ledger | compacto, varredura em linhas | Achar um status na fila |
| Split | master-detail | Comparar a fila com o briefing aberto |

A direção começa aberta. **Promover esta direção** é a escolha humana.
Recarregar a página não promove. No Next, `?promoted=` sem `actor=human`
também não promove.

A rota Next reusa `Button` e `Stack` de `examples/web-seed/components/ui`.
O módulo da fila está em `fixtures/web-journey/static/assets/model.mjs` e,
cópia idêntica, em `examples/web-seed/app/briefing/model.mjs` — o bundler do
seed não importa arquivo fora do pacote. O teste compara os dois.
O picker da fixture estática segue o chrome de `skills/prototype/PICKER.md`.

## Subir o preview estático

Na raiz do repositório, com o host que já está em `packages/preview-host`
(sem alterar auth, health ou confinamento):

```sh
node packages/preview-host/bin/preview-host.mjs \
  --root fixtures/web-journey/static \
  --host 127.0.0.1 \
  --port 4173
```

Abrir `http://127.0.0.1:4173/`. `GET /healthz` precisa trazer `ok: true`.
Campos extras da resposta não fazem parte deste contrato.

## Subir o Next

```sh
cd examples/web-seed
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://127.0.0.1:3000/briefing`. Produção local, depois do build:

```sh
pnpm build
pnpm exec next start --port 3210 --hostname 127.0.0.1
```

`http://127.0.0.1:3210/briefing` é outro processo, outra porta.

## Manifesto

`fixtures/web-journey/static/provenance.json` versionado fica
`binding: unbound`. O hash do artefato **não** inclui esse arquivo.

```sh
node tools/web-journey/prove-load.mjs --with-next --port 4181 --next-port 3210 --out /tmp/od-provenance.json
node tools/web-journey/verify-provenance.mjs --file /tmp/od-provenance.json
```

`prove-load` sobe o host, confere página e assets, percorre lista, filtro
vazio, erro, Ledger, Split e a promoção no Chrome, e — com `--with-next` —
confere a rota Next já compilada (`pnpm build` antes).

`verify-provenance` compara o `sha` do manifesto com `git rev-parse HEAD` e
o hash com os arquivos do artefato. SHA diferente ou arquivo alterado devolve
status `stale`: a evidência anterior fica invalidada até rodar de novo
`write-provenance` ou `prove-load`.

```sh
node tools/web-journey/write-provenance.mjs \
  --local-static http://127.0.0.1:4173/ \
  --local-next http://127.0.0.1:3000/briefing \
  --out /tmp/od-provenance.json
node --test tools/web-journey/journey.test.mjs
```

Não grave um endereço local no campo `deployed`. Não há URL implantada
nesta jornada até alguém publicar de fato.

## Checks

```sh
node --test tools/web-journey/journey.test.mjs
node tools/ds-lint/ds-lint.mjs
cd examples/web-seed && pnpm lint && pnpm build
```
