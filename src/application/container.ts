import { IndexedDbMoodRecordRepository } from "@/infrastructure/db/IndexedDbMoodRecordRepository";
import { IndexedDbSettingsRepository } from "@/infrastructure/db/IndexedDbSettingsRepository";
import { DisabledReflectionProvider } from "@/infrastructure/ai/DisabledReflectionProvider";
import type { ReflectionProvider } from "@/infrastructure/ai/ReflectionProvider";
import { RecordServiceImpl, type RecordService } from "./RecordService";
import { QueryServiceImpl, type QueryService } from "./QueryService";
import { ReviewServiceImpl, type ReviewService } from "./ReviewService";
import { ExportServiceImpl } from "./ExportService";
import { ImportServiceImpl } from "./ImportService";
import type { MoodRecordRepository } from "@/domain/repositories/MoodRecordRepository";
import type { SettingsRepository } from "@/domain/repositories/SettingsRepository";

export interface Container {
  recordRepository: MoodRecordRepository;
  settingsRepository: SettingsRepository;
  recordService: RecordService;
  queryService: QueryService;
  reviewService: ReviewService;
  exportService: ExportServiceImpl;
  importService: ImportServiceImpl;
  reflectionProvider: ReflectionProvider;
}

/**
 * Wire the default (local-first) implementation graph.
 * Tests can build their own container with fakes instead of this.
 */
export function createContainer(): Container {
  const recordRepository = new IndexedDbMoodRecordRepository();
  const settingsRepository = new IndexedDbSettingsRepository();

  return {
    recordRepository,
    settingsRepository,
    recordService: new RecordServiceImpl(recordRepository),
    queryService: new QueryServiceImpl(recordRepository),
    reviewService: new ReviewServiceImpl(recordRepository),
    exportService: new ExportServiceImpl(),
    importService: new ImportServiceImpl(recordRepository),
    reflectionProvider: new DisabledReflectionProvider(),
  };
}

export const container: Container = createContainer();
