import type { IDBPDatabase } from "idb";
import {
  type MoodRecord,
  type MoodRecordDraft,
  type RecordFilter,
} from "@/domain/entities/MoodRecord";
import {
  AppError,
  type MoodRecordRepository,
} from "@/domain/repositories/MoodRecordRepository";
import {
  validateMoodRecord,
  validateMoodRecordDraft,
  validateMoodRecordPatch,
} from "@/features/records/schemas/moodRecord.schema";
import { getDatabase, resetDatabaseCache, toStorageError } from "./database";
import type { FlowSpaceDB } from "./migrations";

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export class IndexedDbMoodRecordRepository implements MoodRecordRepository {
  constructor(private readonly dbFactory: () => Promise<IDBPDatabase<FlowSpaceDB>> = getDatabase) {}

  async create(draft: MoodRecordDraft): Promise<MoodRecord> {
    const valid = validateMoodRecordDraft(draft);
    const ts = nowIso();
    const record: MoodRecord = {
      id: generateId(),
      recordedAt: valid.recordedAt ?? ts,
      emotions: valid.emotions,
      intensity: valid.intensity,
      note: valid.note,
      eventTags: valid.eventTags ?? [],
      customEmotions: valid.customEmotions,
      createdAt: ts,
      updatedAt: ts,
    };

    try {
      const db = await this.dbFactory();
      await db.put("moodRecords", record);
      return record;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async getById(id: string): Promise<MoodRecord | null> {
    try {
      const db = await this.dbFactory();
      const record = await db.get("moodRecords", id);
      return record ?? null;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async list(filter?: RecordFilter): Promise<MoodRecord[]> {
    try {
      const db = await this.dbFactory();
      let records = await db.getAll("moodRecords");

      if (filter?.from) {
        records = records.filter(
          (r) => r.recordedAt >= filter.from!
        );
      }
      if (filter?.to) {
        records = records.filter((r) => r.recordedAt <= filter.to!);
      }
      if (filter?.emotions && filter.emotions.length > 0) {
        const wanted = new Set(filter.emotions);
        records = records.filter((r) =>
          r.emotions.some((e) => wanted.has(e))
        );
      }

      records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

      if (typeof filter?.limit === "number") {
        records = records.slice(0, filter.limit);
      }
      return records;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async update(
    id: string,
    patch: Partial<MoodRecordDraft>
  ): Promise<MoodRecord> {
    // Validate provided fields; rejects e.g. an empty emotions array.
    validateMoodRecordPatch(patch);
    try {
      const db = await this.dbFactory();
      const existing = await db.get("moodRecords", id);
      if (!existing) {
        throw new AppError("RECORD_NOT_FOUND", "记录不存在，可能已被删除。");
      }

      const updated: MoodRecord = {
        ...existing,
        emotions:
          "emotions" in patch ? (patch.emotions as MoodRecord["emotions"]) : existing.emotions,
        intensity:
          "intensity" in patch
            ? (patch.intensity as MoodRecord["intensity"])
            : existing.intensity,
        note: "note" in patch ? patch.note : existing.note,
        eventTags:
          "eventTags" in patch ? (patch.eventTags ?? []) : existing.eventTags,
        customEmotions:
          "customEmotions" in patch
            ? (patch.customEmotions ?? undefined)
            : existing.customEmotions,
        recordedAt:
          "recordedAt" in patch && patch.recordedAt
            ? patch.recordedAt
            : existing.recordedAt,
        updatedAt: nowIso(),
      };

      await db.put("moodRecords", updated);
      return updated;
    } catch (error) {
      if (AppError.isAppError(error)) throw error;
      throw toStorageError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.dbFactory();
      await db.delete("moodRecords", id);
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const db = await this.dbFactory();
      const tx = db.transaction("moodRecords", "readwrite");
      await tx.objectStore("moodRecords").clear();
      await tx.done;
    } catch (error) {
      throw toStorageError(error);
    }
  }
}

export { validateMoodRecord, resetDatabaseCache };
