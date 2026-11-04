"use client";

import {
  dayRangeToFilter,
  lastDaysRange,
  thisMonthRange,
  thisWeekRange,
  toDateInputValue,
} from "@/shared/utils/date";

export interface DateRangeValue {
  /** Active preset key (one of the provided preset keys, or the customKey). */
  preset: string;
  /** Inclusive start as local YYYY-MM-DD, or "" for unbounded. */
  from: string;
  /** Inclusive end as local YYYY-MM-DD, or "" for unbounded. */
  to: string;
}

export interface DateRangePreset {
  key: string;
  label: string;
}

interface DateRangePickerProps {
  presets: DateRangePreset[];
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  /** Preset key that reveals manual date inputs. */
  customKey?: string;
  ariaLabel?: string;
}

/**
 * Resolve a DateRangeValue to an inclusive/exclusive ISO range for filtering.
 * Preset ranges are computed from the current date; only "custom" reads the
 * from/to fields (which are local YYYY-MM-DD).
 */
export function resolveRangeISO(value: DateRangeValue): {
  from: string;
  to: string;
} {
  switch (value.preset) {
    case "all":
      return { from: "", to: "" };
    case "7d":
    case "30d":
    case "90d": {
      const days = value.preset === "7d" ? 7 : value.preset === "30d" ? 30 : 90;
      return lastDaysRange(days);
    }
    case "week":
      return thisWeekRange();
    case "month":
      return thisMonthRange();
    case "custom": {
      const from = value.from ? dayRangeToFilter(value.from).from : "";
      const to = value.to ? dayRangeToFilter(value.to).to : "";
      return { from, to };
    }
    default:
      return { from: "", to: "" };
  }
}

function presetToInput(key: string): { from: string; to: string } {
  const today = toDateInputValue();
  switch (key) {
    case "all":
      return { from: "", to: "" };
    case "7d":
    case "30d":
    case "90d": {
      const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
      const r = lastDaysRange(days);
      return { from: r.from.slice(0, 10), to: today };
    }
    case "week": {
      const r = thisWeekRange();
      return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
    }
    case "month": {
      const r = thisMonthRange();
      return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
    }
    default:
      return { from: "", to: "" };
  }
}

/**
 * Quick date-range selector: a row of preset buttons (no manual typing by
 * default). The "自定义" preset reveals two date inputs for an arbitrary range.
 */
export function DateRangePicker({
  presets,
  value,
  onChange,
  customKey = "custom",
  ariaLabel = "时间范围",
}: DateRangePickerProps) {
  const isCustom = value.preset === customKey;
  const today = toDateInputValue();

  function selectPreset(key: string) {
    if (key === customKey) {
      onChange({
        preset: key,
        from: value.from || today,
        to: value.to || today,
      });
      return;
    }
    const range = presetToInput(key);
    onChange({ preset: key, from: range.from, to: range.to });
  }

  return (
    <div className="date-range-picker">
      <div className="preset-group" role="group" aria-label={ariaLabel}>
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            className={
              value.preset === p.key ? "btn btn-primary sm" : "btn btn-ghost sm"
            }
            aria-pressed={value.preset === p.key}
            onClick={() => selectPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {isCustom ? (
        <div className="date-range">
          <label className="field-label" htmlFor="dr-from">
            从
          </label>
          <input
            id="dr-from"
            type="date"
            className="text-input sm"
            value={value.from}
            max={value.to || today}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <label className="field-label" htmlFor="dr-to">
            到
          </label>
          <input
            id="dr-to"
            type="date"
            className="text-input sm"
            value={value.to}
            min={value.from || undefined}
            max={today}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
