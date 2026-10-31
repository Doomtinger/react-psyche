import { describe, it, expect } from "vitest";
import {
  validateMoodRecordDraft,
  validateMoodRecordPatch,
  validateMoodRecord,
} from "./moodRecord.schema";
import { AppError } from "@/domain/repositories/AppError";
import type { MoodRecordDraft } from "@/domain/entities/MoodRecord";

const baseDraft: MoodRecordDraft = {
  emotions: ["calm"],
  intensity: 3,
};

describe("validateMoodRecordDraft", () => {
  it("accepts a valid draft with optional fields", () => {
    const result = validateMoodRecordDraft({
      ...baseDraft,
      note: "ok",
      eventTags: ["work", "family"],
    });
    expect(result.emotions).toEqual(["calm"]);
    expect(result.intensity).toBe(3);
  });

  it("requires at least one emotion", () => {
    expect(() => validateMoodRecordDraft({ emotions: [], intensity: 3 })).toThrow(
      AppError
    );
  });

  it("rejects intensity out of range", () => {
    expect(() =>
      validateMoodRecordDraft({ emotions: ["calm"], intensity: 9 as never })
    ).toThrow(AppError);
  });

  it("rejects an invalid emotion tag", () => {
    expect(() =>
      validateMoodRecordDraft({
        emotions: ["not-a-tag" as never],
        intensity: 2,
      })
    ).toThrow(AppError);
  });
});

describe("validateMoodRecordPatch", () => {
  it("allows a partial patch", () => {
    const patch = validateMoodRecordPatch({ intensity: 5 });
    expect(patch.intensity).toBe(5);
  });

  it("rejects an empty emotions array in a patch", () => {
    expect(() => validateMoodRecordPatch({ emotions: [] })).toThrow(AppError);
  });
});

describe("validateMoodRecord", () => {
  it("validates a full record shape", () => {
    const record = {
      id: "x",
      recordedAt: "2026-01-01T10:00:00.000Z",
      emotions: ["happy"],
      intensity: 4,
      note: "hi",
      eventTags: ["a"],
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    };
    expect(validateMoodRecord(record).id).toBe("x");
  });

  it("rejects a record missing fields", () => {
    expect(() =>
      validateMoodRecord({ id: "x", emotions: ["calm"], intensity: 3 })
    ).toThrow(AppError);
  });
});
