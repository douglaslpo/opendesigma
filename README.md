# OpenDesigma

**OpenDesigma** is an open stack for agentic prototyping, design, and
web/mobile creation. This repository ships:

1. **Headless Rust design kernel** — document IR, layout, CPU render,
   import/export, pixel diff, local MCP (no egui chrome).
2. **P0 Agent Skills** — router + main flow (prototype → scaffold → gates →
   ship → taste). See [`skills/README.md`](skills/README.md).
3. **Harness overlay (docs)** — how those skills sit on
   [douglaslpo/harness](https://github.com/douglaslpo/harness) SDD phases.
   See [`harness-overlay/README.md`](harness-overlay/README.md).
4. **Web seed** — Next.js App Router + Tailwind + `DESIGN.md` + `tokens.css`.
   See [`examples/web-seed/`](examples/web-seed/).
5. **Evals** — DS reuse + build smoke fixtures. See [`evals/`](evals/).
6. **Context7 stack map** — pinned library IDs for docs retrieval.
   See [`docs/context7-stack.md`](docs/context7-stack.md) /
   [`context7.json`](context7.json).

Kernel based on [desigma](https://github.com/deepfounder-ai/desigma). Skill
metamodel adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills)
(MIT). See `NOTICE`, `UPSTREAM.md`, `LICENSE-MIT`, and `LICENSE-APACHE`.

## Agent skills (quick start)

```sh
# Link into a Cursor project
mkdir -p .cursor/skills
for d in skills/*/; do ln -sfn "$(pwd)/$d" ".cursor/skills/$(basename "$d")"; done
```

Then invoke `/ask-desigma` (router) or a specific skill (`/prototype`,
`/scaffold-web`, `/review-ui`, …). Full catalog and install notes:
[`skills/README.md`](skills/README.md).

| Skill | Job |
| --- | --- |
| `ask-desigma` | Router idea→ship |
| `prototype` | Divergent variants + picker |
| `pick-stack` | Curated web libraries |
| `scaffold-web` | Next/React/Tailwind + `DESIGN.md` |
| `break-ui` | Worst-case data stress |
| `review-ui` | Craft / DS / a11y gate |
| `ship-preview` | Preview URL and/or PR |
| `learn-taste` | Persist corrections → `DESIGN.md` |

## Web seed + evals

Default greenfield shape for `scaffold-web`:

```sh
cd examples/web-seed
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
```

Read [`examples/web-seed/DESIGN.md`](examples/web-seed/DESIGN.md) before UI
work. Run MVP outcome checks from the repo root:

```sh
cd examples/web-seed && pnpm install && cd ../..
node evals/run.mjs
# node evals/run.mjs --skip-build
```

Details: [`evals/README.md`](evals/README.md). Context7 IDs:
[`docs/context7-stack.md`](docs/context7-stack.md).

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
- Node 20+ / pnpm for `examples/web-seed` and `evals/`

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
