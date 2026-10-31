import type { MoodRecord } from "@/domain/entities/MoodRecord";
import type { MoodRecordRepository } from "@/domain/repositories/MoodRecordRepository";

export interface PeriodSummary {
  from: string;
  to: string;
  recordCount: number;
  /** Number of distinct calendar days (local) that contain at least one record. */
  activeDays: number;
  emotionCounts: Record<string, number>;
  /** Arithmetic mean of intensities, or null when there are no records. */
  averageIntensity: number | null;
  recordIds: string[];
}

export interface ReviewService {
  getPeriodSummary(input: {
    from: string;
    to: string;
  }): Promise<PeriodSummary>;
}

export class ReviewServiceImpl implements ReviewService {
  constructor(private readonly repository: MoodRecordRepository) {}

  async getPeriodSummary(input: {
    from: string;
    to: string;
  }): Promise<PeriodSummary> {
    const records: MoodRecord[] = await this.repository.list({
      from: input.from,
      to: input.to,
    });

    const emotionCounts: Record<string, number> = {};
    const activeDays = new Set<string>();
    let intensitySum = 0;

    for (const record of records) {
      for (const emotion of record.emotions) {
        emotionCounts[emotion] = (emotionCounts[emotion] ?? 0) + 1;
      }
      const day = record.recordedAt.slice(0, 10);
      activeDays.add(day);
      intensitySum += record.intensity;
    }

    const averageIntensity =
      records.length > 0
        ? Math.round((intensitySum / records.length) * 100) / 100
        : null;

    return {
      from: input.from,
      to: input.to,
      recordCount: records.length,
      activeDays: activeDays.size,
      emotionCounts,
      averageIntensity,
      recordIds: records.map((r) => r.id),
    };
  }
}
