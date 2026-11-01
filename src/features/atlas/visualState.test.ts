import { describe, it, expect } from "vitest";
import { deriveVisualState } from "./visualState";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

function rec(id: string, recordedAt: string, intensity: 1 | 2 | 3 | 4 | 5, emotions: MoodRecord["emotions"]): MoodRecord {
  return {
    id,
    recordedAt,
    emotions,
    intensity,
    eventTags: [],
    createdAt: recordedAt,
    updatedAt: recordedAt,
  };
}

describe("deriveVisualState", () => {
  it("is deterministic for identical input", () => {
    const records = [rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"])];
    const a = deriveVisualState(records, { start: "2026-02-01T00:00:00.000Z", end: "2026-02-10T00:00:00.000Z" });
    const b = deriveVisualState(records, { start: "2026-02-01T00:00:00.000Z", end: "2026-02-10T00:00:00.000Z" });
    expect(a).toEqual(b);
  });

  it("reports zero coverage and unknown domain when there are no records", () => {
    const state = deriveVisualState([], { start: "2026-02-01T00:00:00.000Z", end: "2026-02-10T00:00:00.000Z" });
    expect(state.recordCount).toBe(0);
    expect(state.dataCoverage).toBe(0);
    expect(state.averageIntensity).toBeNull();
    expect(state.intensityVariance).toBeNull();
  });

  it("computes average intensity and variance", () => {
    const records = [
      rec("a", "2026-02-01T10:00:00.000Z", 1, ["calm"]),
      rec("b", "2026-02-01T12:00:00.000Z", 5, ["angry"]),
    ];
    const state = deriveVisualState(records, { start: "2026-02-01T00:00:00.000Z", end: "2026-02-02T00:00:00.000Z" });
    expect(state.averageIntensity).toBe(3);
    // variance of [1,5] = 4
    expect(state.intensityVariance).toBeCloseTo(4, 5);
  });

  it("groups records into clusters by primary emotion with strength", () => {
    const records = [
      rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm", "happy"]),
      rec("b", "2026-02-02T10:00:00.000Z", 2, ["calm"]),
      rec("c", "2026-02-03T10:00:00.000Z", 4, ["sad"]),
    ];
    const state = deriveVisualState(records, { start: "2026-02-01T00:00:00.000Z", end: "2026-02-04T00:00:00.000Z" });
    const calm = state.clusters.find((c) => c.emotion === "calm");
    expect(calm?.strength).toBe(2);
    expect(calm?.recordIds).toEqual(["a", "b"]);
  });

  it("counts coverage as days with records over the period", () => {
    const records = [
      rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"]),
      rec("b", "2026-02-01T12:00:00.000Z", 3, ["calm"]),
      rec("c", "2026-02-05T10:00:00.000Z", 3, ["calm"]),
    ];
    const state = deriveVisualState(records, { start: "2026-02-01T00:00:00.000Z", end: "2026-02-10T00:00:00.000Z" });
    // 2 of 9 spanned days have records
    expect(state.dataCoverage).toBeCloseTo(2 / 9, 5);
  });
});
