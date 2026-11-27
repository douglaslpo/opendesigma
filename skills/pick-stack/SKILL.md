---
name: pick-stack
description: >
  Pick the library or primitive for a frontend task from the OpenDesigma
  curated stack (Next/React/Tailwind defaults, accessible primitives, toasts,
  drawers, charts, DnD, state). Use when choosing dependencies, "qual lib?",
  "não reinventa toast", or before hand-rolling UI chrome. Prefer what is
  already installed. For scaffolding a new app use scaffold-web.
disable-model-invocation: true
layer: builder
surfaces: [web]
artifacts: [plan, code]
---

# Picking The Stack

## Initial Response

When invoked without a specific question, respond only with:

> Pronto para escolher a lib/primitiva certa no catálogo OpenDesigma.

**Modo orquestrado:** vá ao passo 1.

A lookup skill. Match the **task** to the curated list. Don't substitute
outside the list unless the user asks or the task isn't covered — then say so.

It does ONE thing: recommend (and optionally install) the right dependency.
Not scaffold (`scaffold-web`), not variants (`prototype`).

## How to use

1. **Identify the task**, not the library the user named.
2. **Check `package.json` / lockfile first.** Already installed listed lib → use
   it. Competitor present → flag; don't churn without being asked.
3. **Recommend one library**, one sentence why; install/wire only if requested.
4. **Context7 / docs:** before codegen against an unfamiliar API, resolve→query
   current docs (Context7 or equivalent) — don't invent props from memory.
5. If uncovered, say so and recommend from knowledge, marked *outside catalog*.

## Default web platform (OpenDesigma)

| Concern | Default |
| --- | --- |
| App framework | [Next.js](https://nextjs.org) (App Router) |
| UI runtime | React |
| Styling | Tailwind CSS + project tokens / `DESIGN.md` |
| Deploy preview | Vercel (see `ship-preview`) |

Mobile Expo path is **named but not default** in MVP — say so if asked; use a
future `scaffold-mobile` pack, don't pretend it's in this skill.

## Curated libraries

### UI primitives & chrome

| Task | Library |
| --- | --- |
| Unstyled accessible primitives (dialog, popover, menu, select…) | [base-ui](https://base-ui.com) |
| Command menus (⌘K) | [cmdk](https://cmdk.paco.me) |
| Toasts | [Sonner](https://sonner.emilkowal.ski) |
| Drawers / bottom sheets | [Vaul](https://vaul.emilkowal.ski) |
| OTP inputs | [input-otp](https://input-otp.rodz.dev) |

### Motion & visuals

| Task | Library |
| --- | --- |
| Springs / layout / enter-exit | [motion](https://motion.dev) |
| Animated numbers | [NumberFlow](https://number-flow.barvian.me) |
| Simple hover/fade | **CSS transitions** (no lib) |
| Syntax highlighting | [shiki](https://shiki.style) |
| Dynamic OG | [Satori](https://github.com/vercel/satori) |

### Charts · interaction · state · styling

| Task | Library |
| --- | --- |
| General charts | [recharts](https://recharts.org) |
| Drag and drop | [dnd kit](https://dndkit.com) |
| Virtualization | [Virtuoso](https://virtuoso.dev) |
| Client state | [zustand](https://zustand.docs.pmnd.rs) |
| Conditional `className` | [clsx](https://github.com/lukeed/clsx) |
| Variant-driven Tailwind | [cva](https://cva.style) |
| Theme (no flash) | [next-themes](https://github.com/pacocoursey/next-themes) |

## Common mismatches

- Hand-rolled toast/modal/dropdown → Sonner / base-ui
- 1,000+ row list without virtualization → Virtuoso
- `useState` prop-drilling web → zustand when shared
- Deep template-literal ternaries → clsx or cva
- Installing Motion for a 150ms opacity fade → CSS

## Required output

| Need | Pick | Already in repo? | Action |
| --- | --- | --- | --- |
| Toasts | Sonner | no | install + wire provider |

One recommendation. Stop unless asked to install.
