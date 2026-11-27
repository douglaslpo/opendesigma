# Backend path — optional (Should)

OpenDesigma keeps **UI-only** as the default greenfield (`scaffold-web` /
`examples/web-seed`). Backend is an **optional Should**: minimal API stubs
when the brief needs server endpoints — not a full auth/DB product stack.

## What ships now

| Piece | Path / skill | Role |
| --- | --- | --- |
| Seed | [`examples/api-seed/`](../examples/api-seed/) | Next App Router `GET /api/health` + `POST /api/echo` |
| Scaffold | [`skills/scaffold-backend`](../skills/scaffold-backend/) | Opt-in API skeleton |
| Router | `ask-desigma` | Routes “API / backend / auth stub” → scaffold-backend |
| Stack pick | `pick-stack` | Points backend asks here; UI libs stay UI |
| Docs | this file | Next handlers default · Hono opt-in · Later list |

Handlers **align** with web-seed (same Next/React majors). Prefer copying
`app/api/*` into an existing Next app over inventing a second framework.

## Happy path

```
ask-desigma
  → scaffold-web            (UI default — often enough)
  → scaffold-backend        (only if API needed)
  → break-ui → review-ui → design-jury   (UI surfaces)
  → ship-preview + round-trip            (docs/round-trip.md)
```

Skip `scaffold-backend` when the product is só-UI.

## Default: Next route handlers

```sh
cd examples/api-seed
pnpm install --frozen-lockfile
pnpm dev
curl -s http://127.0.0.1:3000/api/health
```

### Echo contract

`POST /api/echo` counts **octets while reading** the body (`byteLength` on
each chunk). It does not measure JavaScript string length, and it does not
call `request.text()` / `request.json()` (those buffer the whole payload
first). The cap is **65536 bytes** (64 KiB).

| Case | Status | Body |
| --- | --- | --- |
| `Content-Type` without `application/json` | 415 | `{ ok: false, error: "content-type must be application/json" }` |
| Valid JSON, 1–65536 bytes | 200 | `{ ok: true, echo, ts }` |
| Empty body (0 bytes) and `application/json` | 200 | `{ ok: true, echo: null, ts }` |
| Invalid JSON, within the cap | 400 | `{ ok: false, error: "invalid json" }` |
| 65537 bytes or more | 413 | `{ ok: false, error: "payload too large" }` |

Exactly 65536 bytes of valid JSON is accepted. One more byte is rejected and
the unread tail of the stream is cancelled. A multibyte payload whose UTF-16
string length is still under 65536 is rejected once its UTF-8 size passes the
cap — that is the case the old `raw.length` check missed.

A zero-byte body is not invalid JSON. The JSON literal `null` is a different
4-byte body that also echoes `null`. Whitespace-only text is invalid JSON
(400). The content-type check happens before the body is read, so a non-JSON
type returns 415 even when the payload is huge.

UI-only scaffolds do not need this process. `examples/web-seed` has no
`app/api` routes and does not import this package.

Co-locate into web-seed:

```sh
cp -R examples/api-seed/app/api examples/web-seed/app/
```

Docs retrieval: Context7 `/vercel/next.js` in
[`context7-stack.md`](./context7-stack.md).

## Opt-in: Hono (separate process)

Use when the user wants a **standalone** API host (non-Next, or a second
package). Skill flag: `/scaffold-backend --hono`.

- Mirror the same contracts: `GET /health`, `POST /echo`.
- Wire the web app via env base URL or a Next rewrite — **no secrets** in
  client bundles.
- Resolve→query Hono docs in Context7 before codegen; pin the ID in the
  handoff when first used.

This repo’s reference seed stays on **Next handlers** so agents share one
stack with the web default.

## Explicitly Later

- Full auth product (OAuth, sessions, SSO)
- ORM + migrations + multi-tenant data model
- Secrets managers / vaults beyond gitignored `.env*`
- Background jobs, queues, webhooks productization

Stubs ≠ production backend.

## Non-goals

- Replacing web-seed UI with an API-only product
- Mandating backend on every scaffold
- Claiming “auth done” from health/echo stubs

## Related

- Web default: [`examples/web-seed/`](../examples/web-seed/), `scaffold-web`
- Preview → PR: [`round-trip.md`](./round-trip.md), `ship-preview`
- Studio shell: [`studio-shell.md`](./studio-shell.md)
- Blueprint: backend scaffold = v1 Should; path só-UI preserved
