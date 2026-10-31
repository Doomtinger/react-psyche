import type { MoodRecord } from "@/domain/entities/MoodRecord";

/**
 * Feature-level convenience re-exports so components can import from a single
 * location without reaching into the domain layer directly.
 */
export type {
  EmotionTag,
  Intensity,
  MoodRecord,
  MoodRecordDraft,
  RecordFilter,
} from "@/domain/entities/MoodRecord";

export interface EmotionOption {
  value: import("@/domain/entities/MoodRecord").EmotionTag;
  label: string;
  /** Accessible description; must not be the only differentiator. */
  description: string;
}

/** Localized labels for emotion tags. UI text, not a medical taxonomy. */
export const EMOTION_OPTIONS: EmotionOption[] = [
  { value: "calm", label: "平静", description: "放松、安稳" },
  { value: "happy", label: "开心", description: "愉快、满足" },
  { value: "sad", label: "低落", description: "伤感、沉重" },
  { value: "anxious", label: "焦虑", description: "紧张、不安" },
  { value: "angry", label: "愤怒", description: "恼火、烦躁" },
  { value: "tired", label: "疲惫", description: "乏力、困倦" },
  { value: "excited", label: "兴奋", description: "雀跃、期待" },
  { value: "confused", label: "困惑", description: "迷茫、不确定" },
  { value: "other", label: "其他", description: "难以归类" },
];

export const INTENSITY_LABELS: Record<number, string> = {
  1: "很轻",
  2: "较轻",
  3: "中等",
  4: "较强",
  5: "强烈",
};
