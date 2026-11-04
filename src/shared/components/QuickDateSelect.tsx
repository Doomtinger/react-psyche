"use client";

import { toDateInputValue } from "@/shared/utils/date";

interface QuickDateSelectProps {
  /** Current date as local YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

type Mode = "today" | "yesterday" | "custom";

function yesterdayValue(): string {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return toDateInputValue(y);
}

function modeFor(value: string): Mode {
  const today = toDateInputValue();
  const ys = yesterdayValue();
  if (value === today) return "today";
  if (value === ys) return "yesterday";
  return "custom";
}

/**
 * Quick single-date selector for picking when a record happened. Defaults to
 * 今天/昨天 with a 自定义 fallback that reveals a native date input.
 */
export function QuickDateSelect({ value, onChange, id }: QuickDateSelectProps) {
  const today = toDateInputValue();
  const yesterday = yesterdayValue();
  const mode = modeFor(value);

  function pick(m: Mode) {
    if (m === "today") onChange(today);
    else if (m === "yesterday") onChange(yesterday);
    // custom: keep current value, just reveal the input
  }

  return (
    <div className="quick-date">
      <div className="preset-group" role="group" aria-label="日期快捷选择">
        {(
          [
            ["today", "今天"],
            ["yesterday", "昨天"],
            ["custom", "自定义"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            className={mode === m ? "btn btn-primary sm" : "btn btn-ghost sm"}
            aria-pressed={mode === m}
            onClick={() => pick(m)}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "custom" ? (
        <input
          id={id}
          type="date"
          className="text-input"
          value={value}
          max={today}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}
