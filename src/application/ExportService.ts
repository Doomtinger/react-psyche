import type { MoodRecord } from "@/domain/entities/MoodRecord";
import {
  BACKUP_FORMAT,
  CURRENT_SCHEMA_VERSION,
  type BackupFile,
} from "./backup.schema";

export class ExportServiceImpl {
  /** Build the versioned backup object from current records. */
  buildBackup(records: MoodRecord[]): BackupFile {
    return {
      format: BACKUP_FORMAT,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      records,
    };
  }

  /** Serialize records to a JSON string for download / file writing. */
  serializeBackup(records: MoodRecord[]): string {
    return JSON.stringify(this.buildBackup(records), null, 2);
  }
}
