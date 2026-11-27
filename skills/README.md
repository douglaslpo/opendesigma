# OpenDesigma skills (P0)

Agent Skills (`SKILL.md`) for the OpenDesigma main flow: idea → prototype →
build → gates → ship → taste.

Metamodel adapted from [emilkowalski/skills](https://github.com/emilkowalski/skills)
(MIT). Product branding and catalog are OpenDesigma — never “desigma”.

## Catalog

| Skill | Layer | Role |
| --- | --- | --- |
| [`ask-desigma`](ask-desigma/) | router | Choose one skill / short sequence |
| [`prototype`](prototype/) | flow | Divergent variants + picker (`PICKER.md`) |
| [`pick-stack`](pick-stack/) | builder | Curated libs / primitives (web + mobile pointer) |
| [`scaffold-web`](scaffold-web/) | builder | Next + React + Tailwind + `DESIGN.md` |
| [`scaffold-mobile`](scaffold-mobile/) | builder | Expo + RN + `DESIGN.md` / `tokens.ts` |
| [`mobile-feel`](mobile-feel/) | gate | Touch / safe area / native feel |
| [`figma-sync`](figma-sync/) | builder | Figma/Code Connect + tokens (`MAP.md`, `TOKENS.md`) |
| [`break-ui`](break-ui/) | gate | Worst-case data (`CATALOG.md`) |
| [`review-ui`](review-ui/) | gate | Craft / DS / a11y smoke (`STANDARDS.md`) |
| [`design-jury`](design-jury/) | gate | Scored DS + a11y + anti-slop (`RUBRIC.md`, `ANTI-SLOP.md`) |
| [`ship-preview`](ship-preview/) | flow | Shareable preview and/or PR ([preview host](../packages/preview-host/)) |
| [`learn-taste`](learn-taste/) | upkeep | Persist corrections → `DESIGN.md` |

Schema extras in frontmatter (`layer`, `surfaces`, `artifacts`) are
OpenDesigma metadata; hosts that ignore unknown keys still load the skills.

## Install / use

### Cursor

Copy or symlink into the project or user skills dir:

```sh
# project-local (recommended while developing OpenDesigma)
mkdir -p .cursor/skills
ln -s ../../skills/ask-desigma .cursor/skills/ask-desigma
# …repeat per skill, or:
for d in skills/*/; do ln -sfn "$(pwd)/$d" ".cursor/skills/$(basename "$d")"; done
```

Or install via [skills.sh](https://skills.sh) when published:

```sh
npx skills@latest add douglaslpo/opendesigma
```

Invoke explicitly (several P0 skills set `disable-model-invocation: true`):

- `/ask-desigma` — router
- `/prototype` — variants
- `/learn-taste` — end of session

### Claude Code / Codex / other Agent Skills hosts

Point the host at `skills/<name>/` (same layout). Read each `SKILL.md` before
summarizing it.

### With harness overlay

See [`../harness-overlay/README.md`](../harness-overlay/README.md) for mapping
onto [douglaslpo/harness](https://github.com/douglaslpo/harness) SDD phases.
Overlay is documentation + optional symlinks — it does not patch the harness
installer.

## Main flow

```
ask-desigma
  → prototype (+ picker / promote)
  → pick-stack → scaffold-web | scaffold-mobile
  → mobile-feel             (Expo / RN screens)
  → figma-sync              (when Figma / DS map matters)
  → break-ui → review-ui → design-jury
  → ship-preview
  → learn-taste → DESIGN.md
```

Figma bridge: [`../docs/figma-code-connect.md`](../docs/figma-code-connect.md).  
Mobile path: [`../docs/mobile-path.md`](../docs/mobile-path.md) (store = Later).  
Design Jury / DS lint: [`../docs/design-jury.md`](../docs/design-jury.md).

## Companions

| File | Skill | Purpose |
| --- | --- | --- |
| `PICKER.md` | prototype | Verbatim harness chrome |
| `CATALOG.md` | break-ui | Worst-case values |
| `STANDARDS.md` | review-ui | Exact craft values |
| `RUBRIC.md` / `ANTI-SLOP.md` | design-jury | Score seats + anti-slop checklist |
| `MAP.md` / `TOKENS.md` | figma-sync | Registry schema + variable map |

## Attribution

- Skill anatomy / picker / break catalog / taste loop: based on
  emilkowalski/skills (MIT).
- Product flow, naming, stack defaults, scaffold/ship skills: OpenDesigma.
