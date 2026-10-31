import type { EmotionTag } from "@/domain/entities/MoodRecord";

/**
 * Color is an *auxiliary* encoding for emotion tags. It is never the only
 * differentiator — every color is paired with a text label and an icon/shape.
 */
export const EMOTION_COLORS: Record<EmotionTag, string> = {
  calm: "#5b8def",
  happy: "#f4c542",
  sad: "#6c7a96",
  anxious: "#e0567a",
  angry: "#d9534f",
  tired: "#9b8cc4",
  excited: "#f2884b",
  confused: "#5bbfa8",
  other: "#9aa0a6",
};

export function emotionColor(tag: EmotionTag): string {
  return EMOTION_COLORS[tag] ?? EMOTION_COLORS.other;
}
