import { openDB, type IDBPDatabase } from "idb";
import { AppError } from "@/domain/repositories/AppError";
import {
  DB_NAME,
  CURRENT_DB_VERSION,
  runMigrations,
  type FlowSpaceDB,
} from "./migrations";

let dbPromise: Promise<IDBPDatabase<FlowSpaceDB>> | null = null;

/** Open (and memoize) the IndexedDB connection. */
export function getDatabase(): Promise<IDBPDatabase<FlowSpaceDB>> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new AppError(
        "STORAGE_UNAVAILABLE",
        "当前环境不支持本地数据库（IndexedDB）。"
      )
    );
  }
  if (!dbPromise) {
    dbPromise = openDB<FlowSpaceDB>(DB_NAME, CURRENT_DB_VERSION, {
      upgrade(db, oldVersion) {
        runMigrations(db, oldVersion);
      },
    }).catch((error) => {
      dbPromise = null;
      throw toStorageError(error);
    });
  }
  return dbPromise;
}

/** Reset the cached connection (used by tests). */
export function resetDatabaseCache(): void {
  dbPromise = null;
}

/**
 * Map low-level IndexedDB / DOM errors to the app error model.
 * Personal record bodies are intentionally not forwarded into `details`.
 */
export function toStorageError(error: unknown): AppError {
  if (AppError.isAppError(error)) return error;

  const name = (error as { name?: string })?.name;
  const message = (error as { message?: string })?.message;

  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new AppError(
      "STORAGE_QUOTA_EXCEEDED",
      "本地存储空间不足，请导出备份或清理部分记录后重试。"
    );
  }
  return new AppError(
    "STORAGE_UNAVAILABLE",
    message ?? "本地数据库不可用，请检查浏览器设置。"
  );
}
