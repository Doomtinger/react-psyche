import { describe, it, expect } from "vitest";
import {
  buildResonanceSeries,
  DOWNSAMPLE_THRESHOLD,
  MAX_SLICES,
} from "./resonanceEngine";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

function rec(
  id: string,
  recordedAt: string,
  intensity: 1 | 2 | 3 | 4 | 5,
  emotions: MoodRecord["emotions"],
  note?: string,
  eventTags: string[] = []
): MoodRecord {
  return {
    id,
    recordedAt,
    emotions,
    intensity,
    note,
    eventTags,
    createdAt: recordedAt,
    updatedAt: recordedAt,
  };
}

describe("buildResonanceSeries", () => {
  it("is deterministic for identical input", () => {
    const records = [
      rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"], "平静的一天"),
      rec("b", "2026-02-02T10:00:00.000Z", 2, ["happy"]),
    ];
    expect(buildResonanceSeries(records)).toEqual(buildResonanceSeries(records));
  });

  it("sorts slices by time regardless of input order", () => {
    const series = buildResonanceSeries([
      rec("b", "2026-02-02T10:00:00.000Z", 3, ["calm"]),
      rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"]),
      rec("c", "2026-02-03T10:00:00.000Z", 3, ["calm"]),
    ]);
    expect(series.slices.map((s) => s.t)).toEqual([
      ...series.slices.map((s) => s.t),
    ].sort((x, y) => x - y));
    expect(series.meta.recordCount).toBe(3);
  });

  it("acceptance text yields positive coherence and aligned sub-waves", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 3, ["sad"], "我很难过，但我允许自己难过，慢慢来。"),
      rec("b", "2026-02-02T10:00:00.000Z", 2, ["sad"], "难过也没关系，接受它。"),
    ]);
    for (const slice of series.slices) {
      expect(slice.coherence).toBeGreaterThan(0);
      expect(slice.state).toBe("resonant");
      expect(slice.subWaves.every((w) => w.group === "aligned")).toBe(true);
    }
  });

  it("suppression text yields negative coherence, conflict state and counter waves", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 4, ["angry"], "我不该生气，我这点情绪太矫情了。"),
      rec("b", "2026-02-02T10:00:00.000Z", 4, ["angry"], "忍住，不许哭，假装没事。"),
    ]);
    for (const slice of series.slices) {
      expect(slice.coherence).toBeLessThan(-0.2);
      expect(slice.state).toBe("conflict");
    }
    // Single deep-dissonant feelings split an anti-phase inner-voice wave.
    expect(series.slices[0].subWaves.length).toBe(2);
    expect(series.slices[0].subWaves.map((w) => w.group).sort()).toEqual([
      "aligned",
      "opposing",
    ]);
  });

  it("opposite-valence emotions render as two opposing wave groups", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 4, ["happy", "anxious"], "想靠近又害怕。"),
    ]);
    const slice = series.slices[0];
    expect(slice.state).toBe("conflict");
    expect(slice.emotions.length).toBe(2);
    const anxious = slice.subWaves.find((w) => w.tag === "anxious");
    const happy = slice.subWaves.find((w) => w.tag === "happy");
    expect(anxious?.group).toBe("opposing");
    expect(happy?.group).toBe("aligned");
  });

  it("keeps multiple same-direction emotions as separate sub-waves", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 4, ["calm", "happy", "excited"], "平静又开心，还有点期待。"),
    ]);
    const slice = series.slices[0];
    expect(slice.emotions.length).toBe(3);
    expect(slice.subWaves.length).toBe(3);
    expect(slice.subWaves.every((w) => w.group === "aligned")).toBe(true);
    // Primary emotion is strongest.
    expect(slice.subWaves[0].strength).toBeGreaterThanOrEqual(
      slice.subWaves[1].strength
    );
  });

  it("numbness creates a blank gap and a following sharp jump erupts", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 2, ["sad"], "分手了，很难过。", ["分手"]),
      rec("b", "2026-02-03T10:00:00.000Z", 1, ["tired"], "最近很麻木，感觉不到任何情绪。"),
      rec("c", "2026-02-05T10:00:00.000Z", 5, ["angry"], "突然崩溃大哭，火压不住。"),
    ]);
    const gap = series.slices[1];
    expect(gap.isGap).toBe(true);
    expect(gap.state).toBe("isolation");

    const eruption = series.slices[2];
    expect(eruption.state).toBe("eruption");
    expect(eruption.intensity).toBeGreaterThan(gap.intensity * 1.5);
  });

  it("marks perturbation strength from events and intensity", () => {
    const series = buildResonanceSeries([
      rec("a", "2026-02-01T10:00:00.000Z", 5, ["tired"], "被裁员的这段时间很糟糕。", ["裁员"]),
      rec("b", "2026-02-02T10:00:00.000Z", 2, ["tired"], "日常加班。", ["加班"]),
      rec("c", "2026-02-03T10:00:00.000Z", 3, ["calm"], "没什么特别的事。"),
    ]);
    expect(series.slices[0].perturbation.kind).toBe("strong-negative");
    expect(series.slices[1].perturbation.kind).toBe("weak");
    expect(series.slices[2].perturbation.kind).toBe("none");
  });

  it("downsamples long series to the slice cap", () => {
    const records: MoodRecord[] = [];
    for (let i = 0; i < DOWNSAMPLE_THRESHOLD + 30; i++) {
      const day = String((i % 28) + 1).padStart(2, "0");
      records.push(
        rec(
          `r${i}`,
          `2026-01-${day}T1${i % 10}:00:00.000Z`,
          ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          i % 2 === 0 ? ["calm"] : ["anxious"],
          i % 7 === 0 ? "有点累" : undefined
        )
      );
    }
    const series = buildResonanceSeries(records);
    expect(series.meta.downsampled).toBe(true);
    expect(series.slices.length).toBeLessThanOrEqual(MAX_SLICES);
    // Bucket slices keep track of every source record.
    expect(
      series.slices.reduce((sum, s) => sum + s.recordIds.length, 0)
    ).toBe(records.length);
  });
});
