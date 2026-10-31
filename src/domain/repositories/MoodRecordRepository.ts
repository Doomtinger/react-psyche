import type {
  MoodRecord,
  MoodRecordDraft,
  RecordFilter,
} from "@/domain/entities/MoodRecord";
import { AppError } from "./AppError";

/**
 * Persistence contract for mood records.
 *
 * The UI and application services depend only on this interface. The concrete
 * implementation today is IndexedDB; a future cloud implementation can be added
 * without touching the pages.
 */
export interface MoodRecordRepository {
  create(draft: MoodRecordDraft): Promise<MoodRecord>;
  getById(id: string): Promise<MoodRecord | null>;
  list(filter?: RecordFilter): Promise<MoodRecord[]>;
  update(id: string, patch: Partial<MoodRecordDraft>): Promise<MoodRecord>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
}

export { AppError };
