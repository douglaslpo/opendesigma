/**
 * Deterministic break-ui → review-ui → design-jury evidence.
 * The editorial jury skill still owns taste. This module records the
 * mechanical seats and refuses to score accessibility at 5, because a
 * screen reader is a manual pass.
 */

export const PIPELINE = ["break-ui", "review-ui", "ds-lint", "design-jury"];

const BREAK_NEEDLES = [
  ["long-name", "Aleksandra Wiśniewska-Kowalczyk"],
  ["long-email", "bartholomew.fitzgerald@northwind-industries-holdings.example.com"],
  ["diacritics", "Đặng Thị Ngọc Hân"],
  ["rtl", "نور الهدى عبد الرحمن"],
  ["emoji", "🦊 Fox"],
  ["plural-one", "1 note"],
  ["plural-many", "1,284 notes"],
  ["empty", "No reviews in this queue."],
  ["error", "Couldn't load reviews. Try again."],
  ["loading", "Loading reviews"],
  ["disabled", "Archive locked"],
  ["dir-auto", 'dir: "auto"'],
  ["alert", 'role="alert"'],
  ["status", 'role="status"'],
  ["unbroken-word", "Benachrichtigungseinstellungen"],
];

export function assessBreak(benchSrc, cssSrc) {
  const failures = [];
  for (const [id, needle] of BREAK_NEEDLES) {
    if (!benchSrc.includes(needle)) {
      failures.push({ id, message: `bench is missing ${needle}` });
    }
  }
  if (!/overflow-wrap:\s*anywhere/.test(cssSrc)) {
    failures.push({
      id: "wrap",
      message: "extreme strings need overflow-wrap: anywhere",
    });
  }
  if (!cssSrc.includes("prefers-reduced-motion")) {
    failures.push({
      id: "reduced-motion",
      message: "globals.css does not mention prefers-reduced-motion",
    });
  }
  if (/overflow\s*:\s*hidden/.test(cssSrc)) {
    failures.push({
      id: "clip",
      message: "overflow:hidden can clip diacritics and large text",
    });
  }
  return {
    ok: failures.length === 0,
    failures,
    browserStillRequired: ["320px", "200% root font", "keyboard", "focus", "name", "contrast"],
  };
}

export function assessReview({ benchSrc, buttonSrc, globalsSrc }) {
  const failures = [];
  if (!/@\/components\/ui/.test(benchSrc)) {
    failures.push({ id: "reuse", message: "bench must import @/components/ui" });
  }
  if (/export\s+(?:function|const|class)\s+Button\b/.test(benchSrc)) {
    failures.push({ id: "invented-button", message: "bench exports a second Button" });
  }
  if (!/\bButton\b/.test(benchSrc) || !/\bStack\b/.test(benchSrc)) {
    failures.push({ id: "primitives", message: "bench must render Button and Stack" });
  }
  if (!/focus-visible/.test(buttonSrc)) {
    failures.push({ id: "focus", message: "Button is missing focus-visible" });
  }
  if (!/type\s*=\s*["']button["']/.test(buttonSrc) && !/type\s*=\s*type/.test(buttonSrc)) {
    failures.push({ id: "button-type", message: 'Button should default type to "button"' });
  }
  if (!globalsSrc.includes("prefers-reduced-motion")) {
    failures.push({ id: "reduced-motion", message: "reduced motion is not in globals.css" });
  }
  const joined = `${benchSrc}\n${globalsSrc}\n${buttonSrc}`;
  if (/transition\s*:\s*all/.test(joined)) {
    failures.push({ id: "transition-all", message: "transition: all is a craft fail" });
  }
  if (/scale\(\s*0\s*\)/.test(joined)) {
    failures.push({ id: "scale-zero", message: "scale(0) is a craft fail" });
  }
  if (/#[0-9a-fA-F]{3,8}\b/.test(benchSrc)) {
    failures.push({ id: "raw-hex", message: "bench source contains a raw hex" });
  }
  const headings = benchSrc.match(/<h1[\s>]/g) || [];
  if (headings.length !== 1) {
    failures.push({ id: "h1", message: `bench should have one h1, found ${headings.length}` });
  }
  return { ok: failures.length === 0, failures, blockers: failures };
}

/**
 * Mechanical score. Accessibility stays at 4 when the automated probe
 * passes: live screen-reader output is manual and is not invented here.
 */
export function scoreJury({ lint, browser, review, breakReport }) {
  const lintBlockers = lint?.summary?.blockers ?? (lint?.ok ? 0 : 1);
  const browserFailures = browser?.ok ? [] : browser?.failures || [{ id: "browser-missing" }];
  const reviewFailures = review?.ok ? [] : review?.failures || [];
  const breakFailures = breakReport?.ok ? [] : breakReport?.failures || [];
  const blockers = lintBlockers + browserFailures.length + reviewFailures.length + breakFailures.length;

  let ds = 2;
  if (lint?.ok && (lint.summary?.nits ?? 0) === 0 && (lint.summary?.should ?? 0) === 0) ds = 5;
  else if (lint?.ok) ds = 4;

  const a11y = browser?.ok ? 4 : 2;
  const craft = review?.ok && breakReport?.ok ? 4 : 2;
  const ship = ds >= 4 && a11y >= 4 && craft >= 4 && blockers === 0;

  return {
    ds,
    a11y,
    craft,
    blockers,
    total: ds + a11y + craft,
    threshold: "DS≥4 ∧ A11y≥4 ∧ Craft≥4 ∧ blockers=0",
    verdict: ship ? "SHIP" : "NO-SHIP",
    a11yCeiling: 4,
    a11yCeilingReason:
      "Automation checks keyboard, focus, accessible name, contrast, and feedback. It does not run a screen reader.",
    craftCeiling: 4,
    craftCeilingReason:
      "The runner checks reuse, hierarchy, and anti-slop signatures. Editorial taste stays with the design-jury skill.",
  };
}
