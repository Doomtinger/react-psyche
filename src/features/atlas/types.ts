import type { EmotionTag } from "@/domain/entities/MoodRecord";

export interface AtlasNode {
  id: string;
  recordId: string;
  /** [x, y, z] world position. x = time, y = intensity, z = emotion lane. */
  position: [number, number, number];
  color: string;
  label: string;
  recordedAt: string;
  emotions: EmotionTag[];
}
