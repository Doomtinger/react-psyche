"use client";

import { useEffect, useMemo, useState } from "react";
import { container } from "@/application/container";
import { useRecords } from "@/shared/hooks/useRecords";
import { useToast } from "@/shared/components/Toast";
import { INTENSITY_LABELS } from "@/features/records/types";
import { displayEmotions } from "@/features/records/customEmotions";
import { lastDaysRange } from "@/shared/utils/date";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  AntdRangePicker,
  QUICK_RANGE_PRESETS,
  resolveRangeISO,
} from "@/shared/components/AntdRangePicker";
import type { DateRange } from "@/shared/components/AntdRangePicker";
import { RecordDialog } from "@/features/records/components/RecordDialog";
import { EmotionDots } from "@/features/records/components/EmotionBadges";
import type { MoodRecord } from "@/domain/entities/MoodRecord";
import type { PeriodSummary } from "@/application/ReviewService";

const REVIEW_PRESETS = QUICK_RANGE_PRESETS;

export function WeeklyReview() {
  const { records } = useRecords();
  const { notify } = useToast();
  const [range, setRange] = useState<DateRange>(() => {
    const r = lastDaysRange(7);
    return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
  });
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogRecord, setDialogRecord] = useState<MoodRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const r = resolveRangeISO(range);
    if (!r.from || !r.to) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    container.reviewService
      .getPeriodSummary({ from: r.from, to: r.to })
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => {
        if (!cancelled) {
          notify("生成本期回顾失败。", "error");
          setSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, notify]);

  const summaryRecords = useMemo(() => {
    if (!summary) return [];
    const ids = new Set(summary.recordIds);
    return records.filter((r) => ids.has(r.id));
  }, [summary, records]);

  // Distribution on the display layer: custom tags (其他 + user label/color)
  // get their own row instead of collapsing into the generic 其他 bar.
  const emotionDist = useMemo(() => {
    const map = new Map<string, { label: string; color: string; count: number }>();
    for (const record of summaryRecords) {
      for (const emo of displayEmotions(record)) {
        const entry = map.get(emo.key);
        if (entry) entry.count += 1;
        else map.set(emo.key, { label: emo.label, color: emo.color, count: 1 });
      }
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [summaryRecords]);

  const maxEmotion = Math.max(1, ...emotionDist.map(([, e]) => e.count));

  function openRecord(record: MoodRecord) {
    setDialogRecord(record);
    setDialogOpen(true);
  }

  return (
    <div className="review-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">周期回顾</h1>
          <p className="page-subtitle">
            查看一段时间内的记录概况。统计完全基于你当前的本地记录。
          </p>
        </div>
      </header>

      <div className="review-controls">
        <AntdRangePicker
          presets={REVIEW_PRESETS}
          value={range}
          onChange={setRange}
        />
      </div>

      {loading ? (
        <p className="muted">计算中…</p>
      ) : !summary || summary.recordCount === 0 ? (
        <EmptyState
          title="该周期内没有记录"
          description="先记录一些状态，再回来查看你的变化。统计不会展示虚构结果。"
        />
      ) : (
        <div className="review-content">
          <section className="review-stats" aria-label="统计概览">
            <div className="stat-card">
              <span className="stat-value">{summary.recordCount}</span>
              <span className="stat-label">记录数量</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{summary.activeDays}</span>
              <span className="stat-label">有记录的天数</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {summary.averageIntensity ?? "—"}
              </span>
              <span className="stat-label">平均强度</span>
            </div>
          </section>

          <section className="review-section">
            <h2 className="review-section-title">情绪标签分布</h2>
            <div className="emotion-bars">
              {emotionDist.map(([key, entry]) => {
                const width = Math.round((entry.count / maxEmotion) * 100);
                return (
                  <div key={key} className="emotion-bar-row">
                    <span className="emotion-bar-label">{entry.label}</span>
                    <div className="emotion-bar-track">
                      <div
                        className="emotion-bar-fill"
                        style={{
                          width: `${width}%`,
                          backgroundColor: entry.color,
                        }}
                      />
                    </div>
                    <span className="emotion-bar-count">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="review-section">
            <h2 className="review-section-title">
              对应记录（{summaryRecords.length}）
            </h2>
            <ul className="review-records">
              {summaryRecords.map((record) => (
                <li key={record.id}>
                  <button
                    type="button"
                    className="review-record-item"
                    onClick={() => openRecord(record)}
                  >
                    <span className="timeline-emotions">
                      <EmotionDots record={record} />
                    </span>
                    <span className="review-record-meta">
                      {record.recordedAt.slice(0, 10)} · 强度 {record.intensity} ·{" "}
                      {INTENSITY_LABELS[record.intensity]}
                    </span>
                    {record.note ? (
                      <span className="review-record-note">{record.note}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className="review-disclaimer">
            说明：以上统计仅基于所选范围内的真实记录，用于帮助你回顾，不代表任何心理测量或诊断结论。单次状态变化不应被简单归结为某个事件的结果。
          </p>
        </div>
      )}

      <RecordDialog
        open={dialogOpen}
        mode="view"
        record={dialogRecord ?? undefined}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
