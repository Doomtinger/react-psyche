import type { DBSchema, IDBPDatabase } from "idb";
import type { MoodRecord } from "@/domain/entities/MoodRecord";
import type { SettingRecord } from "@/domain/repositories/SettingsRepository";

export const DB_NAME = "flow-space-db";
export const CURRENT_DB_VERSION = 1;

export interface FlowSpaceDB extends DBSchema {
  moodRecords: {
    key: string;
    value: MoodRecord;
    indexes: { recordedAt: string; updatedAt: string };
  };
  settings: {
    key: string;
    value: SettingRecord;
  };
}

/**
 * Apply schema migrations inside the idb `upgrade` callback.
 *
 * The database structure MUST evolve through versioned migrations. Never rely
 * on changing the TypeScript interface alone — older installs would break.
 */
export function runMigrations(
  db: IDBPDatabase<FlowSpaceDB>,
  oldVersion: number
): void {
  if (oldVersion < 1) {
    const store = db.createObjectStore("moodRecords", { keyPath: "id" });
    store.createIndex("recordedAt", "recordedAt");
    store.createIndex("updatedAt", "updatedAt");
    db.createObjectStore("settings", { keyPath: "key" });
  }
  // Future versions:
  // if (oldVersion < 2) { ... }
}
