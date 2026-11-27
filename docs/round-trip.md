# Round-trip leve — preview ↔ repo

OpenDesigma’s light **preview → repo** path: accepted UI (or API stubs) in a
shareable preview becomes a **commit + PR**. Bidirectional IR↔código profundo
= Should→Must em v1; este doc cobre o loop **leve** do MVP/v1 early.

Skill owner: [`ship-preview`](../skills/ship-preview/) (+ companion
[`ROUNDTRIP.md`](../skills/ship-preview/ROUNDTRIP.md)).

## Loop

```
prototype / edit UI (or api stubs)
  → promote explícito (picker ou confirmação humana)
  → preview host :4173  (ou next dev local, rotulado)
  → branch + commit + PR   (sem merge automático)
  → (opcional) stakeholder review no preview URL
  → merge só com pedido explícito
```

Git one-way (preview artefato → PR) is the **minimum**. Pulling remote PR
feedback back into the working tree is normal git; canvas/IR sync is deeper
round-trip (later hardening).

## Promote → commit / PR

1. **Promote** — winner from `prototype` picker, or explicit “esta é a UI”.
   Drop prototype-only chrome unless the user asked to keep it.
2. **Preflight** — build/lint; note gate debt (`break-ui` / `review-ui` /
   `design-jury`). Don’t claim “done” with silent skips (`ship --force`
   still reports debt).
3. **Preview** — prefer
   [`packages/preview-host`](../packages/preview-host/) on **4173**
   ([`preview-host.md`](./preview-host.md)). Label local vs deployed.
4. **Branch** — feature branch off the agreed base (`main` or stack parent).
5. **Commit** — focused diff; message describes the promote, not “wip”.
6. **PR** — body includes summary, preview URL, verify commands, gate status.
   **Do not merge** unless the user explicitly asks.

```sh
# illustrative — follow repo / forge conventions
git checkout -b <feature-branch>
git add -A && git commit -m "<clear promote message>"
git push -u origin <feature-branch>
# open PR via project forge tool — no compulsory merge
```

## Preview host vs next dev

| Surface | When | Label |
| --- | --- | --- |
| Preview host `:4173` | Static export / prototype HTML | Preferred share URL |
| `pnpm dev` `:3000` | Interactive Next (incl. `/api/*`) | Local-only unless tunneled |
| Platform preview (Vercel…) | Durable public URL | Deployed |

API stubs from [`backend-path.md`](./backend-path.md) need a running Next
(or Hono) process — the static preview host does **not** execute route
handlers. For API demos, link the PR to `pnpm dev` / deploy preview, and
still attach any static UI export on `:4173` when useful.

## Checklist (agent)

- [ ] Promote was explicit (human or picker)
- [ ] Preview URL recorded (host + how produced)
- [ ] Feature branch + commit pushed
- [ ] PR opened with verify steps + gate notes
- [ ] No merge without explicit user request
- [ ] No secrets in preview or PR artifacts

## Related

- `ship-preview` skill · [`ROUNDTRIP.md`](../skills/ship-preview/ROUNDTRIP.md)
- Preview host: [`preview-host.md`](./preview-host.md)
- Backend stubs: [`backend-path.md`](./backend-path.md)
- Blueprint: Git bidirecional = Should→Must em v1
