import { describe, it, expect, beforeEach } from "vitest";
import { IndexedDbMoodRecordRepository } from "./IndexedDbMoodRecordRepository";
import { resetDatabaseCache } from "./database";
import { AppError } from "@/domain/repositories/AppError";
import type { MoodRecordDraft } from "@/domain/entities/MoodRecord";

function draft(overrides: Partial<MoodRecordDraft> = {}): MoodRecordDraft {
  return { emotions: ["calm"], intensity: 3, ...overrides };
}

describe("IndexedDbMoodRecordRepository", () => {
  let repo: IndexedDbMoodRecordRepository;

  beforeEach(async () => {
    resetDatabaseCache();
    repo = new IndexedDbMoodRecordRepository();
    await repo.deleteAll();
  });

  it("creates a record with generated id and timestamps", async () => {
    const created = await repo.create(draft({ emotions: ["happy"], intensity: 4 }));
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    expect(created.eventTags).toEqual([]);
  });

  it("rejects an invalid draft on create", async () => {
    await expect(repo.create(draft({ emotions: [] }))).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("lists records sorted by recordedAt descending", async () => {
    await repo.create(
      draft({ recordedAt: "2026-01-01T10:00:00.000Z", emotions: ["calm"] })
    );
    await repo.create(
      draft({ recordedAt: "2026-03-01T10:00:00.000Z", emotions: ["sad"] })
    );
    const list = await repo.list();
    expect(list).toHaveLength(2);
    expect(list[0].recordedAt).toBe("2026-03-01T10:00:00.000Z");
  });

  it("filters by emotion", async () => {
    await repo.create(draft({ emotions: ["calm"] }));
    await repo.create(draft({ emotions: ["angry"] }));
    const list = await repo.list({ emotions: ["angry"] });
    expect(list).toHaveLength(1);
    expect(list[0].emotions).toEqual(["angry"]);
  });

  it("updates a record and bumps updatedAt without changing id", async () => {
    const created = await repo.create(draft());
    const later = new Date(Date.now() + 1000).toISOString();
    const updated = await repo.update(created.id, { intensity: 5, recordedAt: later });
    expect(updated.id).toBe(created.id);
    expect(updated.intensity).toBe(5);
    expect(updated.updatedAt >= created.updatedAt).toBe(true);
  });

  it("throws RECORD_NOT_FOUND on updating a missing record", async () => {
    await expect(
      repo.update("missing", { intensity: 2 })
    ).rejects.toMatchObject({ code: "RECORD_NOT_FOUND" });
  });

  it("deletes a single record", async () => {
    const created = await repo.create(draft());
    await repo.delete(created.id);
    expect(await repo.getById(created.id)).toBeNull();
  });

  it("deletes all records", async () => {
    await repo.create(draft());
    await repo.create(draft({ emotions: ["sad"] }));
    await repo.deleteAll();
    expect(await repo.list()).toHaveLength(0);
  });

  it("getById returns null for a missing record", async () => {
    expect(await repo.getById("nope")).toBeNull();
  });
});
