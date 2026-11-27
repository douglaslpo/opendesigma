# OpenDesigma API seed

Minimal **Next.js App Router API** stubs for the optional backend path.
Aligned with [`../web-seed`](../web-seed/) (same Next/React majors). Used by
`scaffold-backend` and the light `backend-path` eval.

**Default product path is still UI-only** (`scaffold-web`). Auth/DB product
stacks = Later — see [`docs/backend-path.md`](../../docs/backend-path.md).

## Quick start

```sh
pnpm install --frozen-lockfile
pnpm dev      # http://127.0.0.1:3000
```

```sh
curl -s http://127.0.0.1:3000/api/health
curl -s -X POST http://127.0.0.1:3000/api/echo \
  -H 'content-type: application/json' \
  -d '{"ping":true}'
# empty body → 200 {"ok":true,"echo":null,...}
curl -s -X POST http://127.0.0.1:3000/api/echo \
  -H 'content-type: application/json' \
  --data-binary ''
```

```sh
pnpm build
pnpm typecheck
pnpm test:body
API_BASE=http://127.0.0.1:3000 pnpm test:echo
```

`POST /api/echo` stops at **65536 bytes** while reading. The comparison is
`byteLength`, not string length, so a short string of multibyte characters can
still be rejected. Details and the empty-body row are in
[`docs/backend-path.md`](../../docs/backend-path.md).

This package is opt-in. The web seed does not call it.

## Layout

| Path | Role |
| --- | --- |
| `app/api/health/route.ts` | `GET` liveness JSON |
| `app/api/echo/route.ts` | `POST` echo JSON (size + content-type checks) |
| `app/page.tsx` | Tiny pointer page (not a DS surface) |
| `AGENTS.md` | Pointer for coding agents |

## Copy into web-seed

Prefer co-locating handlers in an existing Next app:

```sh
cp -R examples/api-seed/app/api examples/web-seed/app/
```

Then hit `/api/health` on the web-seed `pnpm dev` port.

## Hono alternative

When you need a **separate** API process, use `/scaffold-backend --hono`
(documented in the skill + `docs/backend-path.md`). This seed stays on Next
handlers so agents reuse one stack with the web default.

## Not included

Auth providers, databases, ORMs, migrations, multi-tenant, production secrets.
