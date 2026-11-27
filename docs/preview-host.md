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
| Health | `GET /healthz` → `{"ok":true,…}` |
| Auth | Opcional — ver abaixo |

## Auth mínima

Desligada por padrão (loopback). Para compartilhar na LAN ou tunnel:

1. Defina `OD_PREVIEW_TOKEN=<segredo>` (ou `--token`).
2. Cliente envia `Authorization: Bearer <segredo>` **ou** query `?token=<segredo>`.
3. `/healthz` permanece público (liveness).

Não use secrets de produção. Preview = dados mock/públicos.

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
3. Registrar URL http://127.0.0.1:4173/ (+ token se houver)
4. Opcional: tunnel (ngrok/cloudflared) — labelar como não-oficial
5. Opcional: PR com a URL no body
```

Comandos canônicos: [`packages/preview-host/README.md`](../packages/preview-host/README.md).

## Fora de escopo (MVP)

- Collab / comments / presence
- Multi-tenant / SSO
- Proxy para `next dev`
- Deploy cloud embutido (use Vercel CLI quando precisar de URL pública durável)
