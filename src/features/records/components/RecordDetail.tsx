"use client";

import { Button } from "antd";
import { INTENSITY_LABELS } from "@/features/records/types";
import { formatDateTime } from "@/shared/utils/date";
import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { EmotionBadges } from "./EmotionBadges";

interface RecordDetailProps {
  record: MoodRecord;
  onEdit?: () => void;
  onDelete?: () => void;
  onLocate?: (view: "atlas" | "timeline", recordId: string) => void;
  deleting?: boolean;
}

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
        <EmotionBadges record={record} />
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
            <Button type="text" onClick={() => onLocate("atlas", record.id)}>
              在 Atlas 中查看
            </Button>
            <Button
              type="text"
              onClick={() => onLocate("timeline", record.id)}
            >
              在时间线中查看
            </Button>
          </>
        ) : null}
        {onEdit ? <Button onClick={onEdit}>编辑</Button> : null}
        {onDelete ? (
          <Button danger onClick={onDelete} loading={deleting}>
            删除
          </Button>
        ) : null}
      </div>
    </div>
  );
}
