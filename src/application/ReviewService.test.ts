import { describe, it, expect, beforeEach } from "vitest";
import { IndexedDbMoodRecordRepository } from "@/infrastructure/db/IndexedDbMoodRecordRepository";
import { resetDatabaseCache } from "@/infrastructure/db/database";
import { ReviewServiceImpl } from "./ReviewService";
import type { MoodRecordDraft } from "@/domain/entities/MoodRecord";

function draft(overrides: Partial<MoodRecordDraft> = {}): MoodRecordDraft {
  return { emotions: ["calm"], intensity: 3, ...overrides };
}

describe("ReviewService.getPeriodSummary", () => {
  let repo: IndexedDbMoodRecordRepository;
  let service: ReviewServiceImpl;

  beforeEach(async () => {
    resetDatabaseCache();
    repo = new IndexedDbMoodRecordRepository();
    service = new ReviewServiceImpl(repo);
    await repo.deleteAll();
  });

  it("returns zeroed stats for an empty range", async () => {
    const summary = await service.getPeriodSummary({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-12-31T00:00:00.000Z",
    });
    expect(summary.recordCount).toBe(0);
    expect(summary.activeDays).toBe(0);
    expect(summary.averageIntensity).toBeNull();
  });

  it("computes counts, active days, emotion distribution and average", async () => {
    await repo.create(
      draft({
        recordedAt: "2026-02-01T08:00:00.000Z",
        emotions: ["calm", "happy"],
        intensity: 4,
      })
    );
    await repo.create(
      draft({
        recordedAt: "2026-02-01T20:00:00.000Z",
        emotions: ["calm"],
        intensity: 2,
      })
    );
    await repo.create(
      draft({
        recordedAt: "2026-02-03T09:00:00.000Z",
        emotions: ["sad"],
        intensity: 5,
      })
    );

    const summary = await service.getPeriodSummary({
      from: "2026-02-01T00:00:00.000Z",
      to: "2026-02-04T00:00:00.000Z",
    });

    expect(summary.recordCount).toBe(3);
    expect(summary.activeDays).toBe(2);
    expect(summary.averageIntensity).toBeCloseTo((4 + 2 + 5) / 3, 1);
    expect(summary.emotionCounts["calm"]).toBe(2);
    expect(summary.emotionCounts["happy"]).toBe(1);
    expect(summary.emotionCounts["sad"]).toBe(1);
    expect(summary.recordIds).toHaveLength(3);
  });

  it("restricts results to the requested range", async () => {
    await repo.create(
      draft({ recordedAt: "2026-01-15T10:00:00.000Z", emotions: ["calm"] })
    );
    await repo.create(
      draft({ recordedAt: "2026-03-15T10:00:00.000Z", emotions: ["calm"] })
    );
    const summary = await service.getPeriodSummary({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
    });
    expect(summary.recordCount).toBe(1);
  });
});
