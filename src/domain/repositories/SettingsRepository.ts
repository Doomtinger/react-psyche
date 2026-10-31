/**
 * Key-value store for user preferences and local metadata.
 * Kept separate from mood records so preference writes never block record I/O.
 */
export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface SettingsRepository {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
