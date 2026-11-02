"use client";

import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { displayEmotions } from "../customEmotions";

/**
 * Color dots for compact lists (timeline, home, review). Renders the record's
 * emotions — including custom tags with their user-chosen colors.
 */
export function EmotionDots({ record }: { record: MoodRecord }) {
  return (
    <>
      {displayEmotions(record).map((emo) => (
        <span
          key={emo.key}
          className="emotion-dot"
          style={{ backgroundColor: emo.color }}
          title={emo.label}
          aria-label={emo.label}
        />
      ))}
    </>
  );
}

/**
 * Labeled badges for detail views (dot + text). Custom tags render with the
 * color the user picked in the record form.
 */
export function EmotionBadges({ record }: { record: MoodRecord }) {
  return (
    <>
      {displayEmotions(record).map((emo) => (
        <span
          key={emo.key}
          className="emotion-badge"
          style={{ borderColor: emo.color, color: emo.color }}
        >
          <span
            className="emotion-dot"
            style={{ backgroundColor: emo.color }}
            aria-hidden="true"
          />
          {emo.label}
        </span>
      ))}
    </>
  );
}
