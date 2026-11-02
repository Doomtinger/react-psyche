"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRecords } from "@/shared/hooks/useRecords";
import { useToast } from "@/shared/components/Toast";
import { EMOTION_OPTIONS, INTENSITY_LABELS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import {
  dayRangeToFilter,
  formatTime,
  lastDaysRange,
  localDayKey,
  toDateInputValue,
} from "@/shared/utils/date";
import { cn } from "@/shared/utils/cn";
import { EmptyState } from "@/shared/components/EmptyState";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { RecordDialog } from "@/features/records/components/RecordDialog";
import { EmotionDots } from "@/features/records/components/EmotionBadges";
import type { EmotionTag, MoodRecord } from "@/domain/entities/MoodRecord";

type DialogState = {
  open: boolean;
  mode: "create" | "view" | "edit";
  record?: MoodRecord;
};

export function Timeline() {
  const { records, loading, error, deleteRecord, reload } = useRecords();
  const { notify } = useToast();
  const searchParams = useSearchParams();

  const [selectedEmotions, setSelectedEmotions] = useState<EmotionTag[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preset, setPreset] = useState<"all" | "7d" | "30d" | "90d" | "custom">(
    "all"
  );
  const [query, setQuery] = useState("");

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "create",
  });
  const [pendingDelete, setPendingDelete] = useState<MoodRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (focusId) {
      const target = records.find((r) => r.id === focusId);
      if (target) {
        setDialog({ open: true, mode: "view", record: target });
      }
    }
  }, [searchParams, records]);

  const filtered = useMemo(() => {
    const fromIso = from ? dayRangeToFilter(from).from : undefined;
    const toIso = to ? dayRangeToFilter(to).to : undefined;
    const wanted = selectedEmotions.length
      ? new Set(selectedEmotions)
      : null;
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (fromIso && r.recordedAt < fromIso) return false;
      if (toIso && r.recordedAt >= toIso) return false;
      if (wanted && !r.emotions.some((e) => wanted.has(e))) return false;
      if (q) {
        const haystack = [
          r.note ?? "",
          ...r.eventTags,
          ...r.emotions.map(
            (e) => EMOTION_OPTIONS.find((o) => o.value === e)?.label ?? e
          ),
          ...(r.customEmotions ?? []).map((c) => c.label),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, from, to, selectedEmotions, query]);

  const groups = useMemo(() => {
    const map = new Map<string, MoodRecord[]>();
    for (const r of filtered) {
      const key = localDayKey(r.recordedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return [...map.keys()]
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        items: map
          .get(date)!
          .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
      }));
  }, [filtered]);

  function toggleEmotion(tag: EmotionTag) {
    setSelectedEmotions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function applyPreset(next: "all" | "7d" | "30d" | "90d") {
    setPreset(next);
    if (next === "all") {
      setFrom("");
      setTo("");
      return;
    }
    const days = next === "7d" ? 7 : next === "30d" ? 30 : 90;
    const range = lastDaysRange(days);
    setFrom(toDateInputValue(new Date(range.from)));
    setTo(toDateInputValue(new Date(range.to)));
  }

  function handleCustomDate(which: "from" | "to", value: string) {
    if (which === "from") setFrom(value);
    else setTo(value);
    setPreset("custom");
  }

  function clearFilters() {
    setSelectedEmotions([]);
    setFrom("");
    setTo("");
    setPreset("all");
    setQuery("");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRecord(pendingDelete.id);
      notify("记录已删除", "success");
      setPendingDelete(null);
    } catch {
      notify("删除失败，请重试。", "error");
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters =
    selectedEmotions.length > 0 || from || to || query.trim().length > 0;

  return (
    <div className="timeline-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">时间线</h1>
          <p className="page-subtitle">按时间查看、筛选并管理你的状态记录。</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDialog({ open: true, mode: "create" })}
        >
          + 新建记录
        </button>
      </header>

      <div className="timeline-filters">
        <div className="timeline-quick">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              className="text-input search-input"
              placeholder="搜索笔记、事件标签或情绪…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索记录"
            />
          </div>
          <div className="preset-group" role="group" aria-label="快捷时间范围">
            {(
              [
                ["all", "全部"],
                ["7d", "近一周"],
                ["30d", "近一月"],
                ["90d", "近三月"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={preset === key ? "btn btn-primary sm" : "btn btn-ghost sm"}
                aria-pressed={preset === key}
                onClick={() => applyPreset(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group" role="group" aria-label="情绪筛选">
          {EMOTION_OPTIONS.map((opt) => {
            const active = selectedEmotions.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={cn("filter-chip", active && "active")}
                aria-pressed={active}
                onClick={() => toggleEmotion(opt.value)}
                style={
                  active
                    ? { borderColor: emotionColor(opt.value), color: emotionColor(opt.value) }
                    : undefined
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="date-range">
          <label className="field-label" htmlFor="tl-from">
            从
          </label>
          <input
            id="tl-from"
            type="date"
            className="text-input sm"
            value={from}
            max={to || toDateInputValue()}
            onChange={(e) => handleCustomDate("from", e.target.value)}
          />
          <label className="field-label" htmlFor="tl-to">
            到
          </label>
          <input
            id="tl-to"
            type="date"
            className="text-input sm"
            value={to}
            min={from || undefined}
            max={toDateInputValue()}
            onChange={(e) => handleCustomDate("to", e.target.value)}
          />
        </div>
        {hasFilters ? (
          <button type="button" className="btn btn-ghost sm" onClick={clearFilters}>
            清除筛选
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="muted">加载中…</p>
      ) : error ? (
        <EmptyState
          title="无法读取记录"
          description="请检查浏览器本地存储设置或重试。"
          action={
            <button className="btn btn-secondary" onClick={() => reload()}>
              重试
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={records.length === 0 ? "还没有记录" : "没有符合筛选条件的记录"}
          description={
            records.length === 0
              ? "创建第一条记录，开始你的自我觉察之旅。"
              : "试着调整筛选条件，或清除筛选查看全部。"
          }
          action={
            records.length === 0 ? (
              <button
                className="btn btn-primary"
                onClick={() => setDialog({ open: true, mode: "create" })}
              >
                创建第一条记录
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={clearFilters}>
                清除筛选
              </button>
            )
          }
        />
      ) : (
        <div className="timeline-groups">
          {groups.map((group) => (
            <section key={group.date} className="timeline-group">
              <h2 className="timeline-date">{group.date}</h2>
              <ul className="timeline-list">
                {group.items.map((record) => (
                  <li key={record.id} className="timeline-item">
                    <button
                      type="button"
                      className="timeline-item-main"
                      onClick={() =>
                        setDialog({ open: true, mode: "view", record })
                      }
                    >
                      <span className="timeline-time">
                        {formatTime(record.recordedAt)}
                      </span>
                      <span className="timeline-emotions">
                        <EmotionDots record={record} />
                      </span>
                      <span className="timeline-intensity">
                        强度 {record.intensity} · {INTENSITY_LABELS[record.intensity]}
                      </span>
                      {record.note ? (
                        <span className="timeline-note">{record.note}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <RecordDialog
        open={dialog.open}
        mode={dialog.mode}
        record={dialog.record}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除这条记录？"
        message="删除后该记录将从所有视图中移除，且无法通过此操作恢复（除非你已有备份）。"
        confirmLabel="删除"
        destructive
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
