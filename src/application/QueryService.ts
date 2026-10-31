import type { MoodRecord, RecordFilter } from "@/domain/entities/MoodRecord";
import type { MoodRecordRepository } from "@/domain/repositories/MoodRecordRepository";

export interface QueryService {
  listRecords(filter?: RecordFilter): Promise<MoodRecord[]>;
  getRecord(id: string): Promise<MoodRecord | null>;
}

export class QueryServiceImpl implements QueryService {
  constructor(private readonly repository: MoodRecordRepository) {}

  listRecords(filter?: RecordFilter): Promise<MoodRecord[]> {
    return this.repository.list(filter);
  }

  getRecord(id: string): Promise<MoodRecord | null> {
    return this.repository.getById(id);
  }
}
