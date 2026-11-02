import type {
  CustomEmotion,
  EmotionTag,
  MoodRecord,
} from "@/domain/entities/MoodRecord";
import { emotionColor } from "@/shared/constants/emotions";
import { EMOTION_OPTIONS } from "./types";

/** Cap for user-defined tags per record (UI-level limit). */
export const MAX_CUSTOM_EMOTIONS = 5;

/** Generate a stable key for a custom tag within a record. */
export function makeCustomEmotionKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `custom:${crypto.randomUUID()}`;
  }
  return `custom:${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Built-in tags to render for display. When a record carries custom tags, the
 * generic "other" badge is replaced by the custom ones to avoid duplication.
 */
export function visibleEmotionTags(
  emotions: EmotionTag[],
  customEmotions?: CustomEmotion[]
): EmotionTag[] {
  if (customEmotions && customEmotions.length > 0) {
    return emotions.filter((tag) => tag !== "other");
  }
  return emotions;
}

/** A record emotion resolved for rendering: label + color, custom-aware. */
export interface DisplayEmotion {
  /** Built-in tag, or the custom entry's key for custom tags. */
  key: string;
  label: string;
  color: string;
  isCustom: boolean;
}

/**
 * Unified emotion list for a record: built-in tags first (minus the generic
 * 其他 when custom tags exist), then custom entries with the color the user
 * picked in the form. Every display surface and adapter should source colors
 * from here so custom colors are used consistently.
 */
export function displayEmotions(
  record: Pick<MoodRecord, "emotions" | "customEmotions">
): DisplayEmotion[] {
  const customs = record.customEmotions ?? [];
  const list: DisplayEmotion[] = visibleEmotionTags(
    record.emotions,
    customs
  ).map((tag) => ({
    key: tag,
    label: EMOTION_OPTIONS.find((o) => o.value === tag)?.label ?? tag,
    color: emotionColor(tag),
    isCustom: false,
  }));
  for (const custom of customs) {
    list.push({
      key: custom.key,
      label: custom.label,
      color: custom.color,
      isCustom: true,
    });
  }
  return list;
}
