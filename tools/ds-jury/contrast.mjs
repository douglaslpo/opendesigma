/** WCAG 2 contrast for the jury browser probe. */

function channel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function parseCssColor(input) {
  const text = String(input).trim();
  const hex = text.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    return {
      r: Number.parseInt(hex[1].slice(0, 2), 16),
      g: Number.parseInt(hex[1].slice(2, 4), 16),
      b: Number.parseInt(hex[1].slice(4, 6), 16),
    };
  }
  const rgb = text.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!rgb) return null;
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
}

export function contrastRatio(a, b) {
  const left = typeof a === "string" ? parseCssColor(a) : a;
  const right = typeof b === "string" ? parseCssColor(b) : b;
  if (!left || !right) return null;
  const luminance = (color) =>
    0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  const hi = Math.max(luminance(left), luminance(right));
  const lo = Math.min(luminance(left), luminance(right));
  return (hi + 0.05) / (lo + 0.05);
}

/** Normal text needs 4.5:1. Large text (24px, or 18.66px bold) needs 3:1. */
export function requiredRatio(fontSizePx, fontWeight) {
  const weight = Number(fontWeight);
  const large = fontSizePx >= 24 || (fontSizePx >= 18.66 && weight >= 700);
  return large ? 3 : 4.5;
}
