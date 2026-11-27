# AGENTS.md — OpenDesigma API seed

**UI-only remains the default path.** This package is the optional backend
stub shape for OpenDesigma (Should). Prefer co-locating these handlers under
an existing Next app’s `app/api/` when the product already has UI.

Before inventing server APIs, read [`docs/backend-path.md`](../../docs/backend-path.md)
and the skill `scaffold-backend`.

## Stack

- Next.js App Router route handlers (same majors as `examples/web-seed`)
- TypeScript
- No Tailwind / `DESIGN.md` required here — visual DS lives in web-seed

## Endpoints

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness `{ ok, service, ts }` |
| `POST` | `/api/echo` | Echo small JSON body |

## Docs (Context7)

Pinned IDs: [`docs/context7-stack.md`](../../docs/context7-stack.md).
Resolve→query Next before codegen against unfamiliar route-handler APIs.

## OpenDesigma skills

`ask-desigma` → `scaffold-web` (UI) → optional `scaffold-backend` → gates →
`ship-preview` (+ [`docs/round-trip.md`](../../docs/round-trip.md)).

## Explicitly Later

Full auth product, ORM/migrations, multi-tenant, secrets management beyond
gitignored `.env*`.
