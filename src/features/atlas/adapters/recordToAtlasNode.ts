import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { EMOTION_OPTIONS } from "@/features/records/types";
import { displayEmotions } from "@/features/records/customEmotions";
import { emotionColor } from "@/shared/constants/emotions";
import type { AtlasNode } from "../types";

export type { AtlasNode } from "../types";

/**
 * Map records to 3D scene nodes.
 *
 * Encoding rules (documented for UX transparency):
 * - x (horizontal): chronological order — earlier records to the left.
 * - y (vertical):   self-reported intensity 1–5.
 * - z (depth):      primary emotion lane.
 * - color:          primary emotion (auxiliary only; label is always shown).
 *                   Custom emotion tags use the color the user picked.
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
    // Primary emotion for color/label is custom-aware; the z lane still uses
    // the built-in tag slot (custom tags sit in the 其他 lane).
    const display = displayEmotions(record);
    const primary = display[0] ?? {
      key: "other" as const,
      label: EMOTION_OPTIONS.find((o) => o.value === "other")?.label ?? "other",
      color: emotionColor("other"),
      isCustom: false,
    };
    const primaryTag = record.emotions[0] ?? "other";
    const laneIndex = Math.max(
      0,
      EMOTION_OPTIONS.findIndex((o) => o.value === primaryTag)
    );

    const x =
      n <= 1 ? 0 : (i / (n - 1) - 0.5) * Math.max(8, n * 1.6);
    const y = record.intensity * 0.7;
    const z = (laneIndex - (laneCount - 1) / 2) * 2.4;

    return {
      id: `node-${record.id}`,
      recordId: record.id,
      position: [x, y, z],
      color: primary.color,
      label: primary.label,
      recordedAt: record.recordedAt,
      emotions: record.emotions,
    };
  });
}
