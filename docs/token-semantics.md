# Token semantics

`examples/web-seed/tokens.css` is the canonical source for color, space,
motion, and the web font stacks. `examples/mobile-seed/tokens.ts` is a mirror
of the shared semantics, not a second palette.

`node tools/ds-lint/ds-lint.mjs` compares the two. A shared value that differs
is `token-drift` (blocker). The rows below are the native exceptions: they are
printed and they are not drift.

| Id | Web | Native | Why it is not drift |
| --- | --- | --- | --- |
| `type-faces` | `--font-display`, `--font-sans`, `--font-mono` (Fraunces, Source Sans 3, Source Code Pro) | `type.display` / `type.sans` / `type.mono` (`System`, `System`, `Courier`) | Faces are loaded on the web. React Native keeps platform faces until one is bundled. |
| `ease-curve` | `--ease-out` | none | The cubic-bezier stays in CSS. The mobile button uses press opacity. |
| `space-unit` | `rem`, compared at a 16px root | `px` | `--space-1` is `0.25rem` and `space[1]` is `4`. The numbers match. |
| `button-padding` | `px-5` (20px) on `components/ui/button.tsx` | `space[4] + space[1]` (20) | Same padding, two spellings of the scale. |

Space keys compared: `1 2 3 4 6 8 12 16`. Motion: `fast` 140ms, `med` 280ms.
Color keys: `canvas`, `surface`, `ink`, `quiet`, `accent`, `accentInk`, `line`.

Do not add a web color without the mobile key, or the reverse. Edit the CSS
first, then the mirror.
