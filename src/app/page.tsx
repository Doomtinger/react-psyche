"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecords } from "@/shared/hooks/useRecords";
import { useToast } from "@/shared/components/Toast";
import { INTENSITY_LABELS } from "@/features/records/types";
import {
  formatDate,
  formatTime,
  toDateInputValue,
} from "@/shared/utils/date";
import { EmptyState } from "@/shared/components/EmptyState";
import { RecordDialog } from "@/features/records/components/RecordDialog";
import { EmotionDots } from "@/features/records/components/EmotionBadges";
import type { MoodRecord } from "@/domain/entities/MoodRecord";

export default function HomePage() {
  const { records, loading } = useRecords();
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [focusRecord, setFocusRecord] = useState<MoodRecord | null>(null);

  const today = toDateInputValue();
  const recent = records.slice(0, 5);
  const showGuide = records.length === 0 && !guideDismissed;

  return (
    <div className="home-page">
      <header className="home-hero">
        <p className="home-date">{formatDate(new Date().toISOString())}</p>
        <h1 className="home-title">今天的状态，值得被看见。</h1>
        <p className="home-subtitle">
          花一点时间记录此刻的感受。所有数据都保存在你的浏览器本地，无需注册。
        </p>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setDialogOpen(true)}
        >
          + 快速记录
        </button>
      </header>

      {showGuide ? (
        <div className="home-guide">
          <p>
            Flow Space 把“记录”作为核心资产，用 3D Mind Atlas 帮你回看与探索。
            记录保存在当前浏览器的本地存储中，清除浏览器数据或更换设备可能导致记录无法访问，请定期在设置中导出备份。
          </p>
          <button
            type="button"
            className="btn btn-ghost sm"
            onClick={() => setGuideDismissed(true)}
          >
            知道了，跳过引导
          </button>
        </div>
      ) : null}

      <section className="home-grid">
        <Link href="/atlas" className="home-card">
          <span className="home-card-icon" aria-hidden="true">
            ◍
          </span>
          <span className="home-card-title">Mind Atlas</span>
          <span className="home-card-desc">在 3D 场景中探索你的状态记录。</span>
        </Link>
        <Link href="/timeline" className="home-card">
          <span className="home-card-icon" aria-hidden="true">
            ☰
          </span>
          <span className="home-card-title">时间线</span>
          <span className="home-card-desc">按时间查看、筛选与管理记录。</span>
        </Link>
        <Link href="/review" className="home-card">
          <span className="home-card-icon" aria-hidden="true">
            ◷
          </span>
          <span className="home-card-title">周期回顾</span>
          <span className="home-card-desc">了解一段时间内的状态分布与变化。</span>
        </Link>
      </section>

      <section className="home-recent">
        <div className="home-recent-header">
          <h2 className="home-section-title">最近记录</h2>
          {records.length > 0 ? (
            <Link href="/timeline" className="btn btn-ghost sm">
              查看全部
            </Link>
          ) : null}
        </div>

        {loading ? (
          <p className="muted">加载中…</p>
        ) : records.length === 0 ? (
          <EmptyState
            title="还没有记录"
            description="创建第一条记录，开始你的自我觉察之旅。系统不会替你解释全部感受。"
            action={
              <button
                className="btn btn-primary"
                onClick={() => setDialogOpen(true)}
              >
                创建第一条记录
              </button>
            }
          />
        ) : (
          <ul className="home-recent-list">
            {recent.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  className="home-recent-item"
                  onClick={() => setFocusRecord(record)}
                >
                  <span className="timeline-emotions">
                    <EmotionDots record={record} />
                  </span>
                  <span className="home-recent-meta">
                    {formatDate(record.recordedAt)} {formatTime(record.recordedAt)} ·{" "}
                    {INTENSITY_LABELS[record.intensity]}
                  </span>
                  {record.note ? (
                    <span className="home-recent-note">{record.note}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RecordDialog
        open={dialogOpen}
        mode="create"
        onClose={() => setDialogOpen(false)}
      />
      <RecordDialog
        open={focusRecord !== null}
        mode="view"
        record={focusRecord ?? undefined}
        onClose={() => setFocusRecord(null)}
      />
    </div>
  );
}
