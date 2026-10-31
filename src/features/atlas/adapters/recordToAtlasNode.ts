import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { EMOTION_OPTIONS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import type { AtlasNode } from "../types";

/**
 * Map records to 3D scene nodes.
 *
 * Encoding rules (documented for UX transparency):
 * - x (horizontal): chronological order — earlier records to the left.
 * - y (vertical):   self-reported intensity 1–5.
 * - z (depth):      primary emotion lane.
 * - color:          primary emotion (auxiliary only; label is always shown).
 *
 * Node size is intentionally constant and does NOT encode severity, per the
 * product rule that size must not imply unvalidated psychological states.
 */
export function recordToAtlasNode(records: MoodRecord[]): AtlasNode[] {
  const sorted = [...records].sort((a, b) =>
    a.recordedAt.localeCompare(b.recordedAt)
  );
  const n = sorted.length;
  const laneCount = EMOTION_OPTIONS.length;

  return sorted.map((record, i) => {
    const primary = record.emotions[0] ?? "other";
    const laneIndex = Math.max(
      0,
      EMOTION_OPTIONS.findIndex((o) => o.value === primary)
    );

    const x =
      n <= 1 ? 0 : (i / (n - 1) - 0.5) * Math.max(8, n * 1.6);
    const y = record.intensity * 0.7;
    const z = (laneIndex - (laneCount - 1) / 2) * 2.4;

    const label =
      EMOTION_OPTIONS.find((o) => o.value === primary)?.label ?? primary;

    return {
      id: `node-${record.id}`,
      recordId: record.id,
      position: [x, y, z],
      color: emotionColor(primary),
      label,
      recordedAt: record.recordedAt,
    };
  });
}
