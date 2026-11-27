# AGENTS.md — OpenDesigma web seed

**Before building or changing UI, read [`DESIGN.md`](./DESIGN.md) and
[`code-connect/registry.json`](./code-connect/registry.json).** Prefer
`tokens.css` variables and `components/ui/*` over inventing styles or a second
Button. Figma bridge: [`docs/figma-code-connect.md`](../../docs/figma-code-connect.md)
+ skill `figma-sync`.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4 (theme aliases from `tokens.css`)
- Design grammar: `DESIGN.md` + `tokens.css`

## Docs (Context7)

Pinned library IDs live in the monorepo map:
[`docs/context7-stack.md`](../../docs/context7-stack.md).
Resolve→query before codegen against unfamiliar APIs.

## OpenDesigma skills

From the repo root skills pack: `ask-desigma` → `prototype` → `scaffold-web`
(already applied here) → `figma-sync` (when Figma/DS map matters) →
`break-ui` → `review-ui` → `design-jury` → `ship-preview` → `learn-taste`.
Mechanical DS checks: `node tools/ds-lint/ds-lint.mjs` (see
[`docs/design-jury.md`](../../docs/design-jury.md)).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
