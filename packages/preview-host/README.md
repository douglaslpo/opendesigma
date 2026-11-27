# `@opendesigma/preview-host`

Minimal **static** preview host for OpenDesigma (Opção A — Cursor-centric).

- Serves a directory over HTTP
- `GET /healthz` JSON liveness
- Optional bearer / query token
- Zero npm dependencies (Node ≥ 20)

Spec: [`docs/preview-host.md`](../../docs/preview-host.md).

## Quick start

```sh
# demo page bundled in this package
node packages/preview-host/bin/preview-host.mjs --root packages/preview-host/public
# → http://127.0.0.1:4173/
# → http://127.0.0.1:4173/healthz
```

Serve your artifacts:

```sh
# after copying static HTML / Next `out/` into the preview dir
mkdir -p .opendesigma/preview
# …copy files…
node packages/preview-host/bin/preview-host.mjs
# defaults: root=.opendesigma/preview (if present), port=4173, host=127.0.0.1
```

Or explicitly:

```sh
node packages/preview-host/bin/preview-host.mjs \
  --root examples/web-seed/out \
  --port 4173
```

Optional auth (LAN / tunnel):

```sh
OD_PREVIEW_TOKEN=dev-only node packages/preview-host/bin/preview-host.mjs --root ./out
# curl -H 'Authorization: Bearer dev-only' http://127.0.0.1:4173/
# or http://127.0.0.1:4173/?token=dev-only
```

## Env / flags

| Flag / env | Default |
| --- | --- |
| `--root` / `OD_PREVIEW_ROOT` | `.opendesigma/preview` if exists, else package `public/` |
| `--port` / `OD_PREVIEW_PORT` | `4173` |
| `--host` / `OD_PREVIEW_HOST` | `127.0.0.1` |
| `--token` / `OD_PREVIEW_TOKEN` | off |

## With skills

1. **`prototype`** — build variants; copy the picker HTML (or static export) into the preview root; hand the host URL to the user.
2. **`ship-preview`** — prefer this host before framework deploy / local `next start`. Report `http://127.0.0.1:4173/` (+ auth note).

## Not this package

- Next.js HMR / SSR (use `pnpm dev` in the app)
- OD-style comments daemon
- egui desktop chrome
