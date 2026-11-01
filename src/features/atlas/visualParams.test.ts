import { describe, it, expect } from "vitest";
import { mapToVisualParameters } from "./visualParams";
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

const range = { start: "2026-02-01T00:00:00.000Z", end: "2026-02-28T00:00:00.000Z" };

describe("mapToVisualParameters", () => {
  it("maps higher average intensity to larger amplitude", () => {
    const low = deriveVisualState([rec("a", "2026-02-01T10:00:00.000Z", 1, ["calm"])], range);
    const high = deriveVisualState([rec("a", "2026-02-01T10:00:00.000Z", 5, ["calm"])], range);
    const pLow = mapToVisualParameters(low, false);
    const pHigh = mapToVisualParameters(high, false);
    expect(pHigh.waveAmplitude).toBeGreaterThan(pLow.waveAmplitude);
  });

  it("maps higher intensity variance to more turbulence", () => {
    const flat = deriveVisualState(
      [rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"]), rec("b", "2026-02-02T10:00:00.000Z", 3, ["calm"])], range
    );
    const varied = deriveVisualState(
      [rec("a", "2026-02-01T10:00:00.000Z", 1, ["calm"]), rec("b", "2026-02-02T10:00:00.000Z", 5, ["calm"])], range
    );
    const pFlat = mapToVisualParameters(flat, false);
    const pVaried = mapToVisualParameters(varied, false);
    expect(pVaried.turbulence).toBeGreaterThan(pFlat.turbulence);
  });

  it("stops flow when reduced motion is requested", () => {
    const state = deriveVisualState([rec("a", "2026-02-01T10:00:00.000Z", 3, ["calm"])], range);
    expect(mapToVisualParameters(state, true).flowSpeed).toBe(0);
    expect(mapToVisualParameters(state, false).flowSpeed).toBeGreaterThan(0);
  });

  it("is deterministic for the same state", () => {
    const state = deriveVisualState(
      [rec("a", "2026-02-01T10:00:00.000Z", 4, ["calm"]), rec("b", "2026-02-05T10:00:00.000Z", 2, ["happy"])],
      range
    );
    expect(mapToVisualParameters(state, false)).toEqual(mapToVisualParameters(state, false));
  });

  it("produces a neutral palette when there is no data", () => {
    const state = deriveVisualState([], range);
    const params = mapToVisualParameters(state, false);
    expect(params.colorA).toBe("#33405e");
    expect(params.colorB).toBe("#161d2e");
  });
});
