import type { MoodRecord, MoodRecordDraft } from "@/domain/entities/MoodRecord";
import {
  AppError,
  type MoodRecordRepository,
} from "@/domain/repositories/MoodRecordRepository";
import {
  SUPPORTED_SCHEMA_VERSIONS,
  backupFileSchema,
  type BackupFile,
} from "./backup.schema";

export type ImportStrategy = "merge" | "replace";

export interface ImportPreview {
  valid: boolean;
  schemaVersion: number;
  recordCount: number;
  /** IDs present in both the backup and the current data set. */
  conflicts: string[];
}

function toDraft(record: MoodRecord): MoodRecordDraft {
  return {
    recordedAt: record.recordedAt,
    emotions: record.emotions,
    intensity: record.intensity,
    note: record.note,
    eventTags: record.eventTags,
  };
}

export class ImportServiceImpl {
  constructor(private readonly repository: MoodRecordRepository) {}

  /** Validate the entire file up-front; throws before any write happens. */
  parseBackup(text: string): BackupFile {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AppError("IMPORT_INVALID_FILE", "文件不是有效的 JSON。");
    }

    const result = backupFileSchema.safeParse(parsed);
    if (!result.success) {
      throw new AppError(
        "IMPORT_INVALID_FILE",
        result.error.issues[0]?.message ?? "备份文件格式无效。",
        result.error.flatten()
      );
    }

    if (
      !SUPPORTED_SCHEMA_VERSIONS.includes(
        result.data.schemaVersion as (typeof SUPPORTED_SCHEMA_VERSIONS)[number]
      )
    ) {
      throw new AppError(
        "IMPORT_VERSION_UNSUPPORTED",
        `不支持的备份版本：${result.data.schemaVersion}。`
      );
    }

    return result.data as BackupFile;
  }

  computePreview(
    text: string,
    currentRecords: MoodRecord[]
  ): ImportPreview {
    const backup = this.parseBackup(text);
    const currentIds = new Set(currentRecords.map((r) => r.id));
    const conflicts = backup.records
      .filter((r) => currentIds.has(r.id))
      .map((r) => r.id);

    return {
      valid: true,
      schemaVersion: backup.schemaVersion,
      recordCount: backup.records.length,
      conflicts,
    };
  }

  /**
   * Apply the import.
   * - `merge`: keep existing records, overwrite on ID conflict, create new ones.
   * - `replace`: clear current records first (user already confirmed scope).
   * Returns the number of imported records.
   */
  async importBackup(
    text: string,
    strategy: ImportStrategy
  ): Promise<number> {
    const backup = this.parseBackup(text);

    if (strategy === "replace") {
      await this.repository.deleteAll();
    }

    let imported = 0;
    for (const record of backup.records) {
      const draft = toDraft(record);
      if (strategy === "merge") {
        const existing = await this.repository.getById(record.id);
        if (existing) {
          await this.repository.update(record.id, draft);
        } else {
          await this.repository.create(draft);
        }
      } else {
        await this.repository.create(draft);
      }
      imported += 1;
    }
    return imported;
  }
}
