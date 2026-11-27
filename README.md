# OpenDesigma

**OpenDesigma** is an open design kernel for agentic prototyping, design, and
web/mobile creation. This repository currently ships the **headless Rust
kernel** (document IR, layout engine, CPU render, import/export, pixel diff,
and local MCP) — without the desktop egui chrome.

Based on [desigma](https://github.com/deepfounder-ai/desigma). See `NOTICE`,
`UPSTREAM.md`, `LICENSE-MIT`, and `LICENSE-APACHE`.

## What’s in this workspace

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
