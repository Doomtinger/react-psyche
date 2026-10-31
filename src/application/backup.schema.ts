import { z } from "zod";
import { moodRecordSchema } from "@/features/records/schemas/moodRecord.schema";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

export const BACKUP_FORMAT = "flow-space-backup";
export const CURRENT_SCHEMA_VERSION = 1;
export const SUPPORTED_SCHEMA_VERSIONS = [1] as const;

export interface BackupFile {
  format: string;
  schemaVersion: number;
  exportedAt: string;
  records: MoodRecord[];
}

export const backupFileSchema = z
  .object({
    format: z.string(),
    schemaVersion: z.number().int().min(1),
    exportedAt: z.string().datetime(),
    records: z.array(moodRecordSchema),
  })
  .superRefine((value, ctx) => {
    if (value.format !== BACKUP_FORMAT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["format"],
        message: "不是 Flow Space 备份文件。",
      });
    }
  });
