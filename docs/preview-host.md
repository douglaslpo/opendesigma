# Preview host (MVP)

**Decisão de shell:** Opção A — Cursor-centric + preview host.  
Ver [`studio-shell.md`](studio-shell.md).

Host estático mínimo para `ship-preview` e superfícies de `prototype`. Sem daemon OD-like, sem egui.

## Defaults

| Item | Valor |
| --- | --- |
| Porta local | `4173` (`OD_PREVIEW_PORT`) |
| Bind | `127.0.0.1` (`OD_PREVIEW_HOST`) |
| URL local | `http://127.0.0.1:4173/` |
| Root estático | `.opendesigma/preview` (ou `--root`) |
| Health | `GET /healthz` → `{"ok":true}` |
| Auth | Desligada no loopback. Fora dele, token obrigatório — ver abaixo |

## Auth mínima

Desligada por padrão no loopback (`127.0.0.1`, `::1`, `localhost`). Bind fora de loopback (`0.0.0.0`, LAN, hostname) sem `OD_PREVIEW_TOKEN` encerra o processo.

Para compartilhar na LAN ou num tunnel:

1. Defina `OD_PREVIEW_TOKEN=<segredo>` (ou `--token`).
2. Cliente programático envia `Authorization: Bearer <segredo>` em cada `GET`/`HEAD` (página e assets).
3. Browser: abra `/__preview/login` e envie o token no corpo do `POST /__preview/session`. O host responde com o cookie `od_preview_session` (`HttpOnly`, `SameSite=Strict`, `Path=/`, sem `Domain`). A página e os assets seguintes usam esse cookie.
4. `?token=` responde **400** e não autentica. Não coloque o segredo em link, query ou log de proxy.
5. `POST /__preview/logout` encerra a sessão.

`GET /healthz` continua público. O corpo é só `{"ok":true}` — sem caminho do disco, sem horário de start e sem dizer se a auth está ligada.

Não use secrets de produção. Preview = dados mock/públicos. O cookie não leva o token (só um id de sessão). Em HTTP local o cookie não usa `Secure`, para o loopback continuar funcionando.

Caminhos reservados quando a auth está ligada: `/__preview/login`, `/__preview/session`, `/__preview/logout`.

## Confinamento

O arquivo pedido só é entregue se o caminho real continuar dentro do `--root`. `..`, barras codificadas (`%2f`) e symlink que saia do root recebem 403 ou 404, com corpo genérico. Symlink cujo alvo real permanece dentro do root é servido. A raiz do filesystem é recusada. O stdout de quem subiu o processo ainda mostra o root; a resposta HTTP não.

Contrato local (fixture inofensiva em `packages/preview-host/fixtures/publication/`):

```sh
node --test packages/preview-host/test/publication-contract.test.mjs
```

## O que servir

Qualquer árvore estática:

- Export Next (`output: 'export'` → `out/`) do web-seed ou app gerado.
- HTML self-contained de `prototype` (sem projeto).
- Artefatos copiados para `.opendesigma/preview/`.

O host **não** faz build Next nem HMR — só serve arquivos. Dev interativo continua em `pnpm dev` (porta 3000).

## Fluxo `ship-preview`

```
1. Promover / buildar artefato estático no --root
2. node packages/preview-host/bin/preview-host.mjs --root <dir>
3. Registrar a URL http://127.0.0.1:4173/ (se houver auth, diga Bearer ou cookie — não cole o segredo)
4. Opcional: tunnel (ngrok/cloudflared) — labelar como não-oficial
5. Opcional: PR com a URL no body
```

Comandos canônicos: [`packages/preview-host/README.md`](../packages/preview-host/README.md).

## Fora de escopo (MVP)

- Collab / comments / presence
- Multi-tenant / SSO
- Proxy para `next dev`
- Deploy cloud embutido (use Vercel CLI quando precisar de URL pública durável)
