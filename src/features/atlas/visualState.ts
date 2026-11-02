import type { EmotionTag, MoodRecord } from "@/domain/entities/MoodRecord";
import { localDayKey } from "@/shared/utils/date";
import { displayEmotions } from "@/features/records/customEmotions";

export interface VisualCluster {
  id: string;
  emotion: EmotionTag;
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
  const byPrimaryEmotion = new Map<EmotionTag, string[]>();

  for (const record of records) {
    // Count on the display layer so custom tags (其他 + user label/color)
    // appear with their own identity instead of collapsing into 其他.
    for (const emo of displayEmotions(record)) {
      distribution[emo.key] = (distribution[emo.key] ?? 0) + 1;
      if (emo.isCustom) customColors[emo.key] = emo.color;
    }
    intensities.push(record.intensity);
    daysWithRecords.add(localDayKey(record.recordedAt));
    const primary = record.emotions[0];
    if (primary) {
      const list = byPrimaryEmotion.get(primary) ?? [];
      list.push(record.id);
      byPrimaryEmotion.set(primary, list);
    }
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

  const clusters: VisualCluster[] = [...byPrimaryEmotion.entries()]
    .map(([emotion, recordIds]) => ({
      id: `cluster-${emotion}`,
      emotion,
      recordIds,
      strength: recordIds.length,
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
