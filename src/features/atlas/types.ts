import type { EmotionTag } from "@/domain/entities/MoodRecord";

export interface AtlasNode {
  id: string;
  recordId: string;
  /** [x, y, z] world position. x = time, y = intensity, z = emotion lane. */
  position: [number, number, number];
  /** Primary (first) feeling's color; `emotionColors` keeps the full set. */
  color: string;
  label: string;
  recordedAt: string;
  emotions: EmotionTag[];
  /** Every chosen feeling in display order, custom-tag aware. */
  emotionColors: string[];
  /** Stable keys for every chosen feeling; used for highlight matching. */
  emotionKeys: string[];
}
