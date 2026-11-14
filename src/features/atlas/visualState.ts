import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { localDayKey } from "@/shared/utils/date";
import { displayEmotions } from "@/features/records/customEmotions";

export interface VisualCluster {
  id: string;
  /** Built-in tag or custom-tag key. */
  emotion: string;
  /** Resolved color; custom tags use the color picked in the form. */
  color: string;
  /** A record with several feelings belongs to several clusters. */
  recordIds: string[];
  strength: number;
}

export interface VisualState {
  period: { start: string; end: string };
  /** Fraction of days in the period that have at least one record (0..1). */
  dataCoverage: number;
  /**
   * Emotion counts keyed by built-in tag or custom-tag key. Custom keys must
   * be resolved through `customColors`, not `emotionColor`.
   */
  emotionDistribution: Record<string, number>;
  /** Custom-tag key → the color the user picked in the record form. */
  customColors: Record<string, string>;
  averageIntensity: number | null;
  intensityVariance: number | null;
  /** Normalized 0..1: records per day relative to a reference density. */
  recordDensity: number;
  clusters: VisualCluster[];
  recordCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DENSITY_REFERENCE_PER_DAY = 3;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Derive the analytic `VisualState` from a set of records within a time range.
 * Pure and deterministic: identical inputs always yield an identical state.
 * Absence of records yields an "unknown" state (coverage 0), never "calm".
 */
export function deriveVisualState(
  records: MoodRecord[],
  range: { start: string; end: string }
): VisualState {
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  const daysInRange = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));

  const distribution: Record<string, number> = {};
  const customColors: Record<string, string> = {};
  const intensities: number[] = [];
  const daysWithRecords = new Set<string>();
  const byEmotion = new Map<string, { ids: string[]; color: string }>();

  for (const record of records) {
    // One cluster per *every* chosen feeling, not just the first one. Custom
    // tags keep their own identity and color instead of collapsing into 其他.
    for (const emo of displayEmotions(record)) {
      distribution[emo.key] = (distribution[emo.key] ?? 0) + 1;
      if (emo.isCustom) customColors[emo.key] = emo.color;
      const entry = byEmotion.get(emo.key) ?? { ids: [], color: emo.color };
      entry.ids.push(record.id);
      byEmotion.set(emo.key, entry);
    }
    intensities.push(record.intensity);
    daysWithRecords.add(localDayKey(record.recordedAt));
  }

  const recordCount = records.length;
  const averageIntensity =
    intensities.length > 0
      ? intensities.reduce((sum, v) => sum + v, 0) / intensities.length
      : null;
  const intensityVariance =
    averageIntensity !== null
      ? intensities.reduce(
          (sum, v) => sum + (v - averageIntensity) ** 2,
          0
        ) / intensities.length
      : null;

  const dataCoverage = clamp01(daysWithRecords.size / daysInRange);
  const recordDensity = clamp01(
    recordCount / (daysInRange * DENSITY_REFERENCE_PER_DAY)
  );

  const clusters: VisualCluster[] = [...byEmotion.entries()]
    .map(([emotion, { ids, color }]) => ({
      id: `cluster-${emotion}`,
      emotion,
      color,
      recordIds: ids,
      strength: ids.length,
    }))
    .sort((a, b) => b.strength - a.strength);

  return {
    period: { start: range.start, end: range.end },
    dataCoverage,
    emotionDistribution: distribution,
    customColors,
    averageIntensity,
    intensityVariance,
    recordDensity,
    clusters,
    recordCount,
  };
}
