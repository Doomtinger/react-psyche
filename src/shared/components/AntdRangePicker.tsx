"use client";

import { Button, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  dayRangeToFilter,
  lastDaysRange,
  thisMonthRange,
  thisWeekRange,
} from "@/shared/utils/date";

export interface DateRange {
  /** Inclusive start as local YYYY-MM-DD, or "" for unbounded. */
  from: string;
  /** Inclusive end as local YYYY-MM-DD, or "" for unbounded. */
  to: string;
}

export interface RangePreset {
  key: string;
  label: string;
}

/** Unified quick-range shortcuts shared by every time filter. */
export const QUICK_RANGE_PRESETS: RangePreset[] = [
  { key: "7d", label: "近一周" },
  { key: "30d", label: "近一个月" },
  { key: "90d", label: "近三个月" },
];

interface AntdRangePickerProps {
  /** Bounded quick ranges shown in the picker's preset panel. */
  presets: RangePreset[];
  value: DateRange;
  onChange: (next: DateRange) => void;
  placeholder?: [string, string];
}

/** Resolve a DateRange to an inclusive/exclusive ISO range for filtering. */
export function resolveRangeISO(range: DateRange): { from: string; to: string } {
  const from = range.from ? dayRangeToFilter(range.from).from : "";
  const to = range.to ? dayRangeToFilter(range.to).to : "";
  return { from, to };
}

function presetRange(key: string): DateRange {
  switch (key) {
    case "7d": {
      const r = lastDaysRange(7);
      return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
    }
    case "30d": {
      const r = lastDaysRange(30);
      return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
    }
    case "90d": {
      const r = lastDaysRange(90);
      return { from: r.from.slice(0, 10), to: r.to.slice(0, 10) };
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
 * Date-range filter built on Ant Design's RangePicker. Common ranges are offered
 * as the picker's built-in presets; "全部" clears the selection to unbounded.
 */
export function AntdRangePicker({
  presets,
  value,
  onChange,
  placeholder = ["开始日期", "结束日期"],
}: AntdRangePickerProps) {
  const isAll = !value.from && !value.to;
  const pickerValue: [Dayjs, Dayjs] | null =
    value.from && value.to ? [dayjs(value.from), dayjs(value.to)] : null;

  const antdPresets = presets.map((p) => {
    const r = presetRange(p.key);
    return {
      label: p.label,
      value: [dayjs(r.from), dayjs(r.to)] as [Dayjs, Dayjs],
    };
  });

  return (
    <div className="antd-range-wrap">
      <Button
        size="small"
        type={isAll ? "primary" : "default"}
        onClick={() => onChange({ from: "", to: "" })}
      >
        全部
      </Button>
      <DatePicker.RangePicker
        value={pickerValue}
        presets={antdPresets}
        allowClear
        placeholder={placeholder}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) {
            onChange({
              from: dates[0].format("YYYY-MM-DD"),
              to: dates[1].format("YYYY-MM-DD"),
            });
          } else {
            onChange({ from: "", to: "" });
          }
        }}
      />
    </div>
  );
}
