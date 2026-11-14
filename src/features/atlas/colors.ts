import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { emotionColor } from "@/shared/constants/emotions";

export interface DominantColors {
  a: string;
  b: string;
}

const UNKNOWN = { a: "#33405e", b: "#161d2e" };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return [51, 64, 94];
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Frequency-weighted blend so lower-ranked feelings still tint the field. */
function blendColors(parts: { color: string; weight: number }[]): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (const part of parts) {
    const w = Math.max(0, part.weight);
    const [cr, cg, cb] = hexToRgb(part.color);
    r += cr * w;
    g += cg * w;
    b += cb * w;
    total += w;
  }
  if (total === 0) return parts[0]?.color ?? UNKNOWN.b;
  const channel = (v: number) =>
    Math.round(v / total).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Build a stable two-color palette from an emotion distribution.
 * The most frequent emotion defines `a`; every other emotion is blended into
 * `b` by frequency, so the 3rd+ tag still influences the field colors.
 * Keys are built-in tags or custom-tag keys; custom keys resolve through
 * `customColors` (the color the user picked), built-ins through the shared
 * emotion color library. Deterministic and based purely on real record counts
 * — never randomized. When there is no data, returns a neutral "unknown"
 * palette (not "calm").
 */
export function dominantColors(
  distribution: Record<string, number>,
  customColors: Record<string, string> = {}
): DominantColors {
  const entries = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return UNKNOWN;

  const resolve = (key: string): string =>
    customColors[key] ?? emotionColor(key as EmotionTag);
  const a = resolve(entries[0][0]);
  const second = entries[1];
  let b = second ? resolve(second[0]) : a;
  const rest = entries.slice(2);
  if (rest.length > 0) {
    b = blendColors([
      ...(second ? [{ color: b, weight: second[1] }] : []),
      ...rest.map(([key, count]) => ({ color: resolve(key), weight: count })),
    ]);
  }

  return { a, b };
}
