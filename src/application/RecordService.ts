import type {
  MoodRecord,
  MoodRecordDraft,
  RecordFilter,
} from "@/domain/entities/MoodRecord";
import {
  AppError,
  type MoodRecordRepository,
} from "@/domain/repositories/MoodRecordRepository";

export interface RecordService {
  createRecord(draft: MoodRecordDraft): Promise<MoodRecord>;
  updateRecord(
    id: string,
    patch: Partial<MoodRecordDraft>
  ): Promise<MoodRecord>;
  deleteRecord(id: string): Promise<void>;
  getRecord(id: string): Promise<MoodRecord | null>;
  listRecords(filter?: RecordFilter): Promise<MoodRecord[]>;
}

export class RecordServiceImpl implements RecordService {
  constructor(private readonly repository: MoodRecordRepository) {}

  async createRecord(draft: MoodRecordDraft): Promise<MoodRecord> {
    if (!draft.emotions.length) {
      throw new AppError("VALIDATION_ERROR", "至少需要选择一个有效的情绪标签。");
    }
    if (
      !Number.isInteger(draft.intensity) ||
      draft.intensity < 1 ||
      draft.intensity > 5
    ) {
      throw new AppError("VALIDATION_ERROR", "强度必须为 1–5 的整数。");
    }
    return this.repository.create(draft);
  }

  async updateRecord(
    id: string,
    patch: Partial<MoodRecordDraft>
  ): Promise<MoodRecord> {
    return this.repository.update(id, patch);
  }

  async deleteRecord(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getRecord(id: string): Promise<MoodRecord | null> {
    return this.repository.getById(id);
  }

  async listRecords(filter?: RecordFilter): Promise<MoodRecord[]> {
    return this.repository.list(filter);
  }
}
