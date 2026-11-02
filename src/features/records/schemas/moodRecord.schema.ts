import { z } from "zod";
import {
  EMOTION_TAGS,
  type EmotionTag,
  type Intensity,
  type MoodRecord,
  type MoodRecordDraft,
} from "@/domain/entities/MoodRecord";
import { AppError } from "@/domain/repositories/AppError";

export const emotionTagSchema = z.enum(EMOTION_TAGS);

export const intensitySchema = z
  .number()
  .int("强度必须为整数")
  .min(1, "强度最小为 1")
  .max(5, "强度最大为 5");

export const customEmotionSchema = z.object({
  key: z.string().min(1, "自定义标签缺少标识").max(64),
  label: z
    .string()
    .min(1, "自定义标签名称不能为空")
    .max(12, "自定义标签最长 12 个字"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "自定义标签颜色必须是 #RRGGBB 格式"),
});

export const moodRecordDraftSchema = z.object({
  recordedAt: z
    .string()
    .datetime({ message: "recordedAt 必须是有效的 ISO 8601 时间" })
    .optional(),
  emotions: z
    .array(emotionTagSchema)
    .min(1, "至少需要选择一个有效的情绪标签"),
  intensity: intensitySchema,
  note: z.string().max(2000, "文字内容过长").optional(),
  eventTags: z
    .array(z.string().min(1).max(50))
    .max(30, "事件标签数量过多")
    .optional(),
  customEmotions: z
    .array(customEmotionSchema)
    .max(10, "自定义情绪标签数量过多")
    .optional(),
});

export const moodRecordSchema = moodRecordDraftSchema.extend({
  id: z.string().min(1),
  recordedAt: z.string().datetime(),
  note: z.string().max(2000).optional(),
  eventTags: z.array(z.string().max(50)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Validate a draft, throwing a normalized AppError on failure. */
export function validateMoodRecordDraft(
  draft: unknown
): MoodRecordDraft {
  const result = moodRecordDraftSchema.safeParse(draft);
  if (!result.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ?? "输入无效",
      result.error.flatten()
    );
  }
  return result.data as MoodRecordDraft;
}

/**
 * Partial validation for updates. Empty `emotions` is rejected (a record must
 * keep at least one emotion), but every other field is optional.
 */
export const moodRecordPatchSchema = moodRecordDraftSchema
  .partial()
  .superRefine((value, ctx) => {
    if (value.emotions !== undefined && value.emotions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emotions"],
        message: "至少需要选择一个有效的情绪标签",
      });
    }
  });

export function validateMoodRecordPatch(
  patch: unknown
): Partial<MoodRecordDraft> {
  const result = moodRecordPatchSchema.safeParse(patch);
  if (!result.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      result.error.issues[0]?.message ?? "输入无效",
      result.error.flatten()
    );
  }
  return result.data as Partial<MoodRecordDraft>;
}

/** Validate a full record (used by the import path). */
export function validateMoodRecord(value: unknown): MoodRecord {
  const result = moodRecordSchema.safeParse(value);
  if (!result.success) {
    throw new AppError(
      "IMPORT_INVALID_FILE",
      result.error.issues[0]?.message ?? "记录格式无效",
      result.error.flatten()
    );
  }
  return result.data as MoodRecord;
}

export type { EmotionTag, Intensity, MoodRecord, MoodRecordDraft };
