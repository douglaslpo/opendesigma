/**
 * OpenDesigma mobile-seed design tokens.
 * Semantic values mirror examples/web-seed/tokens.css (same DS grammar).
 * RN consumes these as JS; do not invent one-off hex in components.
 */

export const color = {
  canvas: "#e6eef3",
  surface: "#f7fafc",
  ink: "#132029",
  quiet: "#4a5d6a",
  accent: "#0c7c72",
  accentInk: "#f4fffc",
  line: "#c5d4de",
} as const;

/** 4px base scale — keys match DESIGN.md / web-seed --space-* */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
} as const;

export const motion = {
  fastMs: 140,
  medMs: 280,
} as const;

export const type = {
  display: "System", // swap for a loaded display face when branding needs it
  sans: "System",
  mono: "Courier",
} as const;

export type SpaceKey = keyof typeof space;
