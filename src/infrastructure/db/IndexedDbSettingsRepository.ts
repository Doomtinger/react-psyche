import type { IDBPDatabase } from "idb";
import type { SettingsRepository } from "@/domain/repositories/SettingsRepository";
import { getDatabase, toStorageError } from "./database";
import type { FlowSpaceDB } from "./migrations";

export class IndexedDbSettingsRepository implements SettingsRepository {
  constructor(private readonly dbFactory: () => Promise<IDBPDatabase<FlowSpaceDB>> = getDatabase) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const db = await this.dbFactory();
      const record = await db.get("settings", key);
      return record?.value as T | undefined;
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.dbFactory();
      await db.put("settings", { key, value });
    } catch (error) {
      throw toStorageError(error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.dbFactory();
      await db.delete("settings", key);
    } catch (error) {
      throw toStorageError(error);
    }
  }
}
