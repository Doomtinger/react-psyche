import { describe, it, expect } from "vitest";
import { ExportServiceImpl } from "./ExportService";
import { CURRENT_SCHEMA_VERSION, BACKUP_FORMAT } from "./backup.schema";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

const records: MoodRecord[] = [
  {
    id: "r1",
    recordedAt: "2026-01-01T10:00:00.000Z",
    emotions: ["calm"],
    intensity: 3,
    note: "hi",
    eventTags: ["work"],
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
];

describe("ExportService", () => {
  it("produces a versioned, parseable backup", () => {
    const service = new ExportServiceImpl();
    const json = service.serializeBackup(records);
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(parsed.exportedAt).toBeTruthy();
    expect(parsed.records).toHaveLength(1);
  });

  it("builds an empty backup without throwing", () => {
    const backup = new ExportServiceImpl().buildBackup([]);
    expect(backup.records).toEqual([]);
  });
});
