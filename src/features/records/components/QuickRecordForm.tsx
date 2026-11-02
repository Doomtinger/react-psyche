"use client";

import { useMemo, useState } from "react";
import {
  EMOTION_OPTIONS,
  INTENSITY_LABELS,
} from "@/features/records/types";
import {
  MAX_CUSTOM_EMOTIONS,
  makeCustomEmotionKey,
} from "../customEmotions";
import { emotionColor, EMOTION_COLORS } from "@/shared/constants/emotions";
import { AppError } from "@/domain/repositories/AppError";
import { toDateInputValue } from "@/shared/utils/date";
import { cn } from "@/shared/utils/cn";
import type {
  CustomEmotion,
  EmotionTag,
  Intensity,
  MoodRecord,
  MoodRecordDraft,
} from "@/domain/entities/MoodRecord";

interface QuickRecordFormProps {
  initial?: MoodRecord;
  onSubmit: (draft: MoodRecordDraft) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

function parseEventTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
    )
  ).slice(0, 30);
}

function toDateValue(iso?: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : toDateInputValue();
}

function toTimeValue(iso?: string): string {
  if (!iso) return new Date().toTimeString().slice(0, 5);
  const d = new Date(iso);
  return `${`${d.getHours()}`.padStart(2, "0")}:${`${d.getMinutes()}`.padStart(2, "0")}`;
}

export function QuickRecordForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "保存",
}: QuickRecordFormProps) {
  const [emotions, setEmotions] = useState<EmotionTag[]>(
    initial?.emotions ?? []
  );
  const [customEmotions, setCustomEmotions] = useState<CustomEmotion[]>(
    initial?.customEmotions ?? []
  );
  const [customInput, setCustomInput] = useState("");
  const [customColor, setCustomColor] = useState(EMOTION_COLORS.other);
  const [intensity, setIntensity] = useState<Intensity>(
    initial?.intensity ?? 3
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [eventTagsInput, setEventTagsInput] = useState(
    initial?.eventTags.join(", ") ?? ""
  );
  const [dateValue, setDateValue] = useState(toDateValue(initial?.recordedAt));
  const [timeValue, setTimeValue] = useState(toTimeValue(initial?.recordedAt));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherActive = emotions.includes("other");
  const customFull = customEmotions.length >= MAX_CUSTOM_EMOTIONS;

  const canSubmit = useMemo(() => emotions.length > 0, [emotions]);

  function toggleEmotion(tag: EmotionTag) {
    setEmotions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    // Custom tags live under 其他: closing it discards them.
    if (tag === "other" && otherActive) {
      setCustomEmotions([]);
    }
  }

  function addCustomEmotion() {
    const label = customInput.trim();
    if (!label || customFull) return;
    if (customEmotions.some((c) => c.label === label)) {
      setCustomInput("");
      return;
    }
    setCustomEmotions((prev) => [
      ...prev,
      { key: makeCustomEmotionKey(), label, color: customColor },
    ]);
    if (!otherActive) setEmotions((prev) => [...prev, "other"]);
    setCustomInput("");
  }

  /**
   * Commit anything still pending in the composer (typed label + picked
   * color that never went through 添加标签). Saving must never silently drop
   * what the user typed — this is the safety net for direct 保存 clicks.
   */
  function commitPendingCustom(): {
    customs: CustomEmotion[];
    emotions: EmotionTag[];
  } {
    const label = customInput.trim();
    const canAdd =
      label &&
      customEmotions.length < MAX_CUSTOM_EMOTIONS &&
      !customEmotions.some((c) => c.label === label);
    if (!canAdd) return { customs: customEmotions, emotions };
    return {
      customs: [
        ...customEmotions,
        { key: makeCustomEmotionKey(), label, color: customColor },
      ],
      emotions: emotions.includes("other") ? emotions : [...emotions, "other"],
    };
  }

  function removeCustomEmotion(key: string) {
    const next = customEmotions.filter((c) => c.key !== key);
    setCustomEmotions(next);
    // Last custom tag removed → drop the auto-added 其他 tag as well.
    if (next.length === 0) {
      setEmotions((prev) => prev.filter((t) => t !== "other"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submission
    if (emotions.length === 0) {
      setError("请至少选择一个情绪标签。");
      return;
    }

    const combined = new Date(`${dateValue}T${timeValue}`);
    const recordedAt = Number.isNaN(combined.getTime())
      ? undefined
      : combined.toISOString();

    // Auto-commit pending composer input so a direct 保存 click cannot lose it.
    const committed = commitPendingCustom();
    setCustomEmotions(committed.customs);
    setEmotions(committed.emotions);
    setCustomInput("");

    const draft: MoodRecordDraft = {
      recordedAt,
      emotions: committed.emotions,
      intensity,
      note: note.trim() || undefined,
      eventTags: parseEventTags(eventTagsInput),
      customEmotions:
        committed.customs.length > 0 ? committed.customs : undefined,
    };

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(draft);
    } catch (err) {
      const message = AppError.isAppError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : "保存失败，请重试。";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="field">
        <legend className="field-label">情绪标签</legend>
        <div className="emotion-grid" role="group" aria-label="情绪标签">
          {EMOTION_OPTIONS.map((opt) => {
            const active = emotions.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={cn("emotion-chip", active && "active")}
                aria-pressed={active}
                onClick={() => toggleEmotion(opt.value)}
                style={
                  active
                    ? { borderColor: emotionColor(opt.value), color: emotionColor(opt.value) }
                    : undefined
                }
              >
                <span
                  className="emotion-dot"
                  style={{ backgroundColor: emotionColor(opt.value) }}
                  aria-hidden="true"
                />
                <span className="emotion-chip-label">{opt.label}</span>
                <span className="visually-hidden">{opt.description}</span>
              </button>
            );
          })}
        </div>

        {otherActive ? (
          <div className="custom-emotion-composer">
            <input
              type="text"
              className="text-input sm custom-emotion-input"
              value={customInput}
              maxLength={12}
              placeholder="输入自定义标签（最多 12 字）"
              aria-label="自定义情绪标签名称"
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // keep Enter from submitting the form
                  addCustomEmotion();
                }
              }}
            />
            <input
              type="color"
              className="color-picker"
              value={customColor}
              aria-label="选择标签颜色"
              title="选择标签颜色"
              onChange={(e) => setCustomColor(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary sm"
              onClick={addCustomEmotion}
              disabled={!customInput.trim() || customFull}
            >
              添加标签
            </button>
          </div>
        ) : null}

        {customEmotions.length > 0 ? (
          <div className="custom-emotion-list" role="list" aria-label="自定义情绪标签">
            {customEmotions.map((custom) => (
              <span
                key={custom.key}
                role="listitem"
                className="custom-emotion-chip"
                style={{ borderColor: custom.color, color: custom.color }}
              >
                <span
                  className="emotion-dot"
                  style={{ backgroundColor: custom.color }}
                  aria-hidden="true"
                />
                {custom.label}
                <button
                  type="button"
                  className="custom-emotion-remove"
                  aria-label={`删除标签 ${custom.label}`}
                  onClick={() => removeCustomEmotion(custom.key)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">
          状态强度：<strong>{INTENSITY_LABELS[intensity]}</strong>
        </legend>
        <div className="intensity-row" role="radiogroup" aria-label="状态强度">
          {([1, 2, 3, 4, 5] as Intensity[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={intensity === value}
              aria-label={`强度 ${value}：${INTENSITY_LABELS[value]}`}
              className={cn("intensity-pip", intensity >= value && "filled")}
              onClick={() => setIntensity(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="field-label" htmlFor="record-note">
          文字（可选）
        </label>
        <textarea
          id="record-note"
          className="text-input"
          value={note}
          maxLength={2000}
          rows={3}
          placeholder="此刻发生了什么？你的感受是怎样的？"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="record-events">
          生活事件标签（可选，用空格或逗号分隔）
        </label>
        <input
          id="record-events"
          className="text-input"
          value={eventTagsInput}
          placeholder="例如：work family exercise"
          onChange={(e) => setEventTagsInput(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="record-date">
            日期
          </label>
          <input
            id="record-date"
            type="date"
            className="text-input"
            value={dateValue}
            max={toDateInputValue()}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="record-time">
            时间
          </label>
          <input
            id="record-time"
            type="time"
            className="text-input"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        {onCancel ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            取消
          </button>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !canSubmit}
        >
          {submitting ? "保存中…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
