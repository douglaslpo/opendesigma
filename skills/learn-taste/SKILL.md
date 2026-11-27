---
name: learn-taste
description: >
  Turn a session's design corrections into rules (with their why) in DESIGN.md,
  a project skill, or a lint check. Use at end of a design session, when the
  user says "para de repetir esse erro", "grava o taste", "learn taste", or
  wants preferences persisted. Never invent taste the user did not express.
  Does not change component code.
disable-model-invocation: true
layer: upkeep
surfaces: [both]
artifacts: [design-md, plan]
---

# Learning Taste

Every correction a user makes is taste the agent didn't have. If it isn't
written down, the next session repeats the mistake. This skill finds those
corrections, turns each into a rule with its reason, and writes it where the
next agent will read it.

It does ONE thing: **write rules**. It never changes component code, and it
never adds a rule the user didn't express.

## Hard Rules

1. **Only the user's taste.** Every rule traces to something the user said,
   edited, or confirmed — never "good practice" from the model.
2. **Never invent a why.** If missing, propose marked *inferred* and confirm
   before writing.
3. **Propose, then stop.** Write only what the user approves (`write all` /
   `write 1, 3`).
4. **A check beats a sentence.** Prefer lint / token restriction / test when
   matchable.
5. **Write for an agent that wasn't here.** No "like we discussed".
6. **OpenDesigma priority:** taste do usuário > `DESIGN.md` existente >
   defaults do produto > defaults do modelo.

## Workflow

### Phase 1: Collect corrections

Read the current conversation. Signals: explicit correction, silent edit,
repeated nudge, revert/rejection (incl. picker promote), confirmed
non-obvious choice. Skip functional bugs and one-screen content.

**Completion:** every correction listed with quote or diff.

### Phase 2: Filter

Would a fresh agent building a *different* component make the same mistake?
One-off → Skipped. Existing rule same → rewrite stricter. Contradicts → show
both. Matchable → Check candidate.

### Phase 3: Generalize and find the why

Prefer **class** level over instance or universal. Strict wording (values,
tokens, always/never). Self-test: rule alone would produce what the user wanted?

### Phase 4: Decide where it goes

Default → repo-root **`DESIGN.md`** under: Surfaces · Color · Typography ·
Spacing & layout · Motion · Interaction · Copy · Components (registry).

If neither `AGENTS.md` nor `CLAUDE.md` points to it, propose:
`Before building or changing UI, read DESIGN.md.`

Entry format:

```md
## Surfaces

- **Raised surfaces use `shadow-raised`, never a solid border.**
  Why: …
  <!-- 2026-11-27: "no, sombra semi, não borda" -->
```

### Phase 5: Report and stop

### Phase 6: Write on approval

Write only approved items. Show diff. For checks, implement and report hits —
never fix component code without asking.

## Required Output Format

### Rules to add

| # | You said | Rule | Why | Where |
| --- | --- | --- | --- | --- |
| 1 | "…" | … | … | DESIGN.md › Surfaces |

### Needs your answer

### Conflicts

### Make it a check

### Skipped

Close with: `Say write all or write 1, 3, and answer the questions above.`

If no taste corrections: say so in one line — that's a good result.

## Invocation Variants

| Invocation | Behavior |
| --- | --- |
| `/learn-taste` | Current session → report → stop |
| `write all` / `write 1, 3` | Write approved items |
| `/learn-taste prune` | Propose merges/stricter wording in DESIGN.md |
