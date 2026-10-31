/**
 * Canonical domain types for Flow Space.
 *
 * These types are the single source of truth consumed by the UI, the 3D
 * Mind Atlas adapter and the persistence layer. Future cloud or AI adapters
 * must use the same contracts so the page and business layers do not change.
 */

export const EMOTION_TAGS = [
  "calm",
  "happy",
  "sad",
  "anxious",
  "angry",
  "tired",
  "excited",
  "confused",
  "other",
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

export type Intensity = 1 | 2 | 3 | 4 | 5;

/**
 * A persisted mood record. All timestamps are ISO 8601 strings (UTC).
 * Display layers convert to the user's local timezone.
 */
export interface MoodRecord {
  id: string;
  recordedAt: string;
  emotions: EmotionTag[];
  intensity: Intensity;
  note?: string;
  eventTags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload used to create or partially update a record. The service/repository
 * boundary fills in the remaining fields (id, timestamps).
 */
export interface MoodRecordDraft {
  recordedAt?: string;
  emotions: EmotionTag[];
  intensity: Intensity;
  note?: string;
  eventTags?: string[];
}

export interface RecordFilter {
  from?: string;
  to?: string;
  emotions?: EmotionTag[];
  limit?: number;
  cursor?: string;
}
