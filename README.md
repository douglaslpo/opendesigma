# OpenDesigma

**OpenDesigma** is an open stack for agentic prototyping, design, and
web/mobile creation. This repository ships:

1. **Headless Rust design kernel** — document IR, layout, CPU render,
   import/export, pixel diff, local MCP (no egui chrome).
2. **P0 Agent Skills** — router + main flow (prototype → scaffold → gates →
   Design Jury → ship → taste). See [`skills/README.md`](skills/README.md).
3. **Harness overlay (docs)** — how those skills sit on
   [douglaslpo/harness](https://github.com/douglaslpo/harness) SDD phases.
   See [`harness-overlay/README.md`](harness-overlay/README.md).
4. **Web seed** — Next.js App Router + Tailwind + `DESIGN.md` + `tokens.css`.
   See [`examples/web-seed/`](examples/web-seed/).
5. **Mobile seed** — Expo + React Native + shared token grammar.
   See [`examples/mobile-seed/`](examples/mobile-seed/) and
   [`docs/mobile-path.md`](docs/mobile-path.md) (App Store = Later).
6. **API seed (optional)** — Next App Router health/echo stubs.
   See [`examples/api-seed/`](examples/api-seed/) and
   [`docs/backend-path.md`](docs/backend-path.md) (UI-only remains default).
7. **Evals** — DS reuse + DS lint + build smoke + mobile/backend path fixtures.
   See [`evals/`](evals/).
8. **Context7 stack map** — pinned library IDs for docs retrieval.
   See [`docs/context7-stack.md`](docs/context7-stack.md) /
   [`context7.json`](context7.json).
9. **Preview host** — static share URL for `ship-preview` / `prototype`
   (Opção A shell). See [`packages/preview-host/`](packages/preview-host/)
   and [`docs/preview-host.md`](docs/preview-host.md). Light preview→PR
   round-trip: [`docs/round-trip.md`](docs/round-trip.md).
10. **Figma / Code Connect bridge** — map web-seed components + tokens for
    agents (`figma-sync`). See [`docs/figma-code-connect.md`](docs/figma-code-connect.md)
    and [`examples/web-seed/code-connect/`](examples/web-seed/code-connect/).
11. **Design Jury + DS lint** — scored quality gate + mechanical token/
    component checks. See [`docs/design-jury.md`](docs/design-jury.md),
    [`skills/design-jury/`](skills/design-jury/), [`tools/ds-lint/`](tools/ds-lint/).

Kernel based on [desigma](https://github.com/deepfounder-ai/desigma). Skill
metamodel adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills)
(MIT). See `NOTICE`, `UPSTREAM.md`, `LICENSE-MIT`, and `LICENSE-APACHE`.

**Quickstart (pt-BR):** skills + Context7 + preview host + seeds + fluxo
`ask-desigma` + Design Jury — [`docs/quickstart.md`](docs/quickstart.md).

## Agent skills (quick start)

```sh
# Link into a Cursor project
mkdir -p .cursor/skills
for d in skills/*/; do ln -sfn "$(pwd)/$d" ".cursor/skills/$(basename "$d")"; done
```

Then invoke `/ask-desigma` (router) or a specific skill (`/prototype`,
`/scaffold-web`, `/scaffold-mobile`, `/review-ui`, …). Full catalog and install
notes: [`skills/README.md`](skills/README.md).

| Skill | Job |
| --- | --- |
| `ask-desigma` | Router idea→ship |
| `prototype` | Divergent variants + picker |
| `pick-stack` | Curated libraries (web + mobile pointer) |
| `scaffold-web` | Next/React/Tailwind + `DESIGN.md` |
| `scaffold-mobile` | Expo/RN + `DESIGN.md` / `tokens.ts` |
| `scaffold-backend` | Optional API (Next `app/api` · Hono opt-in) |
| `mobile-feel` | Touch / safe area / native feel |
| `figma-sync` | Figma/Code Connect + token sync |
| `break-ui` | Worst-case data stress |
| `review-ui` | Craft / DS / a11y gate |
| `design-jury` | Scored DS + a11y + anti-slop |
| `ship-preview` | Preview URL and/or PR (+ round-trip) |
| `learn-taste` | Persist corrections → `DESIGN.md` |

## Web seed + evals

Default greenfield shape for `scaffold-web`:

```sh
cd examples/web-seed
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
```

Read [`examples/web-seed/DESIGN.md`](examples/web-seed/DESIGN.md) and
[`examples/web-seed/code-connect/registry.json`](examples/web-seed/code-connect/registry.json)
before UI work. Figma bridge:
[`docs/figma-code-connect.md`](docs/figma-code-connect.md).

## Mobile seed (Expo)

Named Expo path for `scaffold-mobile` — same token semantics as web-seed.
**App Store / Play = Later.** Guide: [`docs/mobile-path.md`](docs/mobile-path.md).

```sh
cd examples/mobile-seed
npm install
npx expo start
```

## API seed (optional backend)

Optional Next route handlers for `scaffold-backend`. **UI-only remains the
default.** Guide: [`docs/backend-path.md`](docs/backend-path.md).

```sh
cd examples/api-seed
pnpm install
pnpm dev
curl -s http://127.0.0.1:3000/api/health
```

Run MVP outcome checks from the repo root:

```sh
cd examples/web-seed && pnpm install && cd ../..
node evals/run.mjs
# node evals/run.mjs --skip-build   # includes mobile-path + backend-path + ds-lint
node tools/ds-lint/ds-lint.mjs      # mechanical DS lint only
```

Details: [`evals/README.md`](evals/README.md), [`docs/design-jury.md`](docs/design-jury.md).
Context7 IDs: [`docs/context7-stack.md`](docs/context7-stack.md).

## Preview host (Cursor-centric)

Studio shell = Cursor + skills; shareable preview via a tiny static host
(no OD daemon / no egui). Decision: [`docs/studio-shell.md`](docs/studio-shell.md).

```sh
node packages/preview-host/bin/preview-host.mjs --root packages/preview-host/public
# → http://127.0.0.1:4173/   ·   GET /healthz
```

Point `--root` at Next `out/` or prototype HTML. Skills `ship-preview` and
`prototype` prefer this path. Full spec:
[`docs/preview-host.md`](docs/preview-host.md). Promote → commit/PR:
[`docs/round-trip.md`](docs/round-trip.md).

## What’s in the kernel workspace

| Crate | Role |
| --- | --- |
| `desigma-doc` | Scene graph, paints, undo/redo |
| `desigma-engine` | Shared edit/layout transactions |
| `desigma-render` | Deterministic CPU renderer (tiny-skia) |
| `desigma-fonts` | Bundled Inter + Fontsource cache |
| `desigma-fig` / `desigma-svg` / `desigma-pen` | Figma / SVG / Pencil import |
| `desigma-export` | PNG/JPG/SVG/PDF + Dev Mode codegen |
| `desigma-diff` | Pixel / SSIM harness |
| `desigma-library` | On-disk project library |
| `desigma-mcp` | Local stdio MCP server |

Crate names keep the upstream identifiers for technical continuity; the
**product** name is OpenDesigma.

## Requirements

- Rust toolchain pinned in `rust-toolchain.toml` (currently 1.93.1)
- Standard Linux/macOS/Windows build deps for a Rust workspace (no egui/GPU)
- Node 20+ / pnpm for `examples/web-seed` and `evals/`; npm/Expo for
  `examples/mobile-seed`

## Build

```sh
cargo build --locked -p desigma-mcp
```

Binary: `target/debug/desigma-mcp` (add `.exe` on Windows). Use `--release` for
an optimized build.

Smoke-check the rest of the kernel:

```sh
cargo check --locked --workspace
cargo test --locked -p desigma-doc -p desigma-engine -p desigma-mcp -- --test-threads=1
```

## Run the MCP server

```sh
mkdir -p designs
cargo run --locked -p desigma-mcp -- --workspace "$(pwd)/designs"
```

Example MCP client config (stdio):

```json
{
  "mcpServers": {
    "opendesigma": {
      "command": "/absolute/path/to/opendesigma/target/debug/desigma-mcp",
      "args": ["--workspace", "/absolute/path/to/designs"]
    }
  }
}
```

Tool names remain `desigma_*` for compatibility with the document API. The
server identity is branded as OpenDesigma. File sessions work headless; live
editor bridge requires a separate desktop host (not shipped here).

## License

MIT OR Apache-2.0. Notices and upstream attribution: `NOTICE`, `UPSTREAM.md`.
