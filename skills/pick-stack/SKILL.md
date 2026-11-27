---
name: pick-stack
description: >
  Pick the library or primitive for a frontend task from the OpenDesigma
  curated stack (Next/React/Tailwind defaults, accessible primitives, toasts,
  drawers, charts, DnD, state). Use when choosing dependencies, "qual lib?",
  "não reinventa toast", or before hand-rolling UI chrome. Prefer what is
  already installed. For scaffolding a new web app use scaffold-web; for Expo
  mobile use scaffold-mobile (docs/mobile-path.md).
disable-model-invocation: true
layer: builder
surfaces: [both]
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
Not scaffold (`scaffold-web` / `scaffold-mobile`), not variants (`prototype`).

## How to use

1. **Identify the task**, not the library the user named.
2. **Surface first:** web → catalog below; mobile/Expo/RN → point to
   `scaffold-mobile` + `docs/mobile-path.md` (and Context7 `/expo/expo`,
   `/facebook/react-native`) — don't paste web-only libs into RN.
3. **Check `package.json` / lockfile first.** Already installed listed lib → use
   it. Competitor present → flag; don't churn without being asked.
4. **Recommend one library**, one sentence why; install/wire only if requested.
5. **Context7 / docs:** before codegen against an unfamiliar API, resolve→query
   current docs (Context7 or equivalent) — don't invent props from memory.
6. If uncovered, say so and recommend from knowledge, marked *outside catalog*.

## Default platforms (OpenDesigma)

| Concern | Web default | Mobile path |
| --- | --- | --- |
| App framework | [Next.js](https://nextjs.org) (App Router) | [Expo](https://expo.dev) / React Native |
| UI runtime | React | React Native |
| Styling | Tailwind + `DESIGN.md` / `tokens.css` | `DESIGN.md` + `tokens.ts` (same semantics) |
| Scaffold | `scaffold-web` | `scaffold-mobile` (`examples/mobile-seed`) |
| Feel / craft | `review-ui` | `mobile-feel` → `review-ui` |
| Deploy preview | Vercel (`ship-preview`) | Preview/PR via `ship-preview`; **store = Later** |

Web is still the MVP default. Mobile is an **explicit named path** — use
`scaffold-mobile` when the brief is Expo/RN; never pretend store submit is in
scope (see `docs/mobile-path.md`).

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
