"use client";

import { EMOTION_OPTIONS, INTENSITY_LABELS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import { formatDateTime } from "@/shared/utils/date";
import type { EmotionTag, MoodRecord } from "@/domain/entities/MoodRecord";

interface RecordDetailProps {
  record: MoodRecord;
  onEdit?: () => void;
  onDelete?: () => void;
  onLocate?: (view: "atlas" | "timeline", recordId: string) => void;
  deleting?: boolean;
}

const emotionLabel = (tag: EmotionTag) =>
  EMOTION_OPTIONS.find((o) => o.value === tag)?.label ?? tag;

export function RecordDetail({
  record,
  onEdit,
  onDelete,
  onLocate,
  deleting = false,
}: RecordDetailProps) {
  return (
    <div className="record-detail">
      <div className="detail-meta">
        <span>{formatDateTime(record.recordedAt)}</span>
        <span className="detail-intensity">
          强度 {record.intensity} · {INTENSITY_LABELS[record.intensity]}
        </span>
      </div>

      <div className="detail-emotions" aria-label="情绪标签">
        {record.emotions.map((tag) => (
          <span
            key={tag}
            className="emotion-badge"
            style={{ borderColor: emotionColor(tag), color: emotionColor(tag) }}
          >
            <span
              className="emotion-dot"
              style={{ backgroundColor: emotionColor(tag) }}
              aria-hidden="true"
            />
            {emotionLabel(tag)}
          </span>
        ))}
      </div>

      {record.note ? (
        <p className="detail-note">{record.note}</p>
      ) : (
        <p className="detail-note muted">（没有文字说明）</p>
      )}

      {record.eventTags.length > 0 ? (
        <div className="detail-events" aria-label="事件标签">
          {record.eventTags.map((tag) => (
            <span key={tag} className="event-tag">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <p className="detail-timestamps">
        创建于 {formatDateTime(record.createdAt)} · 更新于{" "}
        {formatDateTime(record.updatedAt)}
      </p>

      <div className="detail-actions">
        {onLocate ? (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onLocate("atlas", record.id)}
            >
              在 Atlas 中查看
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onLocate("timeline", record.id)}
            >
              在时间线中查看
            </button>
          </>
        ) : null}
        {onEdit ? (
          <button type="button" className="btn btn-secondary" onClick={onEdit}>
            编辑
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "删除中…" : "删除"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
