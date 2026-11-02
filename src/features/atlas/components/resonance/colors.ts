/**
 * Color helpers for the resonance flow.
 *
 * The requirement's color rule: the envelope line uses the slice's dominant
 * emotion color, with saturation softened in resonant regions and dimmed /
 * darkened in conflict regions. Everything stays within the shared emotion
 * color library — only lightness/saturation are adjusted.
 */

interface Hsl {
  h: number;
  s: number; // 0..1
  l: number; // 0..1
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, "0").repeat(3)}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Dominant-emotion color adjusted by coherence:
 * - resonant (towards +1): softer saturation, slightly lighter (柔和通透)
 * - conflict (towards -1): lower saturation, darker (压低、暗沉)
 */
export function shadeForCoherence(hex: string, coherence: number): string {
  const hsl = hexToHsl(hex);
  const c = Math.min(1, Math.max(-1, coherence));
  if (c >= 0) {
    return hslToHex({
      h: hsl.h,
      s: hsl.s * (1 - 0.25 * c),
      l: Math.min(0.92, hsl.l + 0.06 * c),
    });
  }
  const k = -c;
  return hslToHex({
    h: hsl.h,
    s: hsl.s * Math.max(0.35, 1 - 0.45 * k),
    l: Math.max(0.12, hsl.l - 0.16 * k),
  });
}
