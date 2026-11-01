import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { emotionColor } from "@/shared/constants/emotions";

export interface DominantColors {
  a: string;
  b: string;
}

const UNKNOWN = { a: "#33405e", b: "#161d2e" };

/**
 * Build a stable two-color palette from an emotion distribution.
 * The most frequent emotion defines `a`, the second most frequent defines `b`.
 * Deterministic and based purely on real record counts — never randomized.
 * When there is no data, returns a neutral "unknown" palette (not "calm").
 */
export function dominantColors(
  distribution: Record<string, number>
): DominantColors {
  const entries = Object.entries(distribution)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return UNKNOWN;

  const a = emotionColor(entries[0][0] as EmotionTag);
  const b = entries[1]
    ? emotionColor(entries[1][0] as EmotionTag)
    : a;

  return { a, b };
}
