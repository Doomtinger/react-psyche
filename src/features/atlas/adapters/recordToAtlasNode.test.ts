import { describe, it, expect } from "vitest";
import { recordToAtlasNode } from "./recordToAtlasNode";
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

describe("recordToAtlasNode", () => {
  it("produces one node per record with finite coordinates", () => {
    const records = [
      rec("a", "2026-01-01T10:00:00.000Z", 2, ["calm"]),
      rec("b", "2026-01-02T10:00:00.000Z", 5, ["angry"]),
    ];
    const nodes = recordToAtlasNode(records);
    expect(nodes).toHaveLength(2);
    for (const n of nodes) {
      expect(Number.isFinite(n.position[0])).toBe(true);
      expect(Number.isFinite(n.position[1])).toBe(true);
      expect(Number.isFinite(n.position[2])).toBe(true);
      expect(n.color).toBeTruthy();
    }
  });

  it("maps intensity to the vertical axis", () => {
    const low = recordToAtlasNode([rec("a", "2026-01-01T10:00:00.000Z", 1, ["calm"])])[0];
    const high = recordToAtlasNode([rec("b", "2026-01-01T10:00:00.000Z", 5, ["calm"])])[0];
    expect(high.position[1]).toBeGreaterThan(low.position[1]);
  });

  it("preserves chronological ordering on the x axis", () => {
    const nodes = recordToAtlasNode([
      rec("a", "2026-01-03T10:00:00.000Z", 3, ["calm"]),
      rec("b", "2026-01-01T10:00:00.000Z", 3, ["calm"]),
    ]);
    expect(nodes[0].position[0]).toBeLessThan(nodes[1].position[0]);
  });
});
