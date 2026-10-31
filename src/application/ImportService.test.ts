import { describe, it, expect, beforeEach } from "vitest";
import { IndexedDbMoodRecordRepository } from "@/infrastructure/db/IndexedDbMoodRecordRepository";
import { resetDatabaseCache } from "@/infrastructure/db/database";
import { ImportServiceImpl } from "./ImportService";
import { AppError } from "@/domain/repositories/AppError";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

function makeRecord(id: string, emotions: MoodRecord["emotions"] = ["calm"]): MoodRecord {
  return {
    id,
    recordedAt: "2026-01-01T10:00:00.000Z",
    emotions,
    intensity: 3,
    note: "note",
    eventTags: [],
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  };
}

const validBackup = {
  format: "flow-space-backup",
  schemaVersion: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  records: [makeRecord("a"), makeRecord("b", ["sad"])],
};

describe("ImportService", () => {
  let repo: IndexedDbMoodRecordRepository;
  let service: ImportServiceImpl;

  beforeEach(async () => {
    resetDatabaseCache();
    repo = new IndexedDbMoodRecordRepository();
    service = new ImportServiceImpl(repo);
    await repo.deleteAll();
  });

  it("rejects a non-JSON file", () => {
    expect(() => service.parseBackup("not json")).toThrow(AppError);
  });

  it("rejects an invalid format", () => {
    const bad = JSON.stringify({
      format: "other",
      schemaVersion: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      records: [],
    });
    expect(() => service.parseBackup(bad)).toThrow(/不是 Flow Space/);
  });

  it("rejects an unsupported schema version", () => {
    const bad = JSON.stringify({
      format: "flow-space-backup",
      schemaVersion: 99,
      exportedAt: "2026-01-01T00:00:00.000Z",
      records: [],
    });
    expect(() => service.parseBackup(bad)).toThrow(/不支持/);
  });

  it("previews conflicts before applying", () => {
    const preview = service.computePreview(
      JSON.stringify(validBackup),
      [makeRecord("b")]
    );
    expect(preview.recordCount).toBe(2);
    expect(preview.conflicts).toEqual(["b"]);
  });

  it("merge import adds new records and overwrites conflicts", async () => {
    const existing = await repo.create({ emotions: ["happy"], intensity: 3 });
    const backup = {
      format: "flow-space-backup",
      schemaVersion: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      records: [
        makeRecord("a"),
        { ...makeRecord(existing.id), emotions: ["sad"] as MoodRecord["emotions"] },
      ],
    };
    const imported = await service.importBackup(
      JSON.stringify(backup),
      "merge"
    );
    expect(imported).toBe(2);
    const all = await repo.list();
    expect(all).toHaveLength(2);
    const conflict = all.find((r) => r.id === existing.id)!;
    expect(conflict.emotions).toEqual(["sad"]);
  });

  it("replace import clears existing records first", async () => {
    await repo.create(makeRecord("existing"));
    const imported = await service.importBackup(
      JSON.stringify(validBackup),
      "replace"
    );
    expect(imported).toBe(2);
    const all = await repo.list();
    expect(all.find((r) => r.id === "existing")).toBeUndefined();
    expect(all).toHaveLength(2);
  });
});
