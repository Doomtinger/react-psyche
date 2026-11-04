"use client";

import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface AntdDatePickerProps {
  /** Current date as local YYYY-MM-DD. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/** Single-date picker built on Ant Design's DatePicker, with 今天/昨天 presets. */
export function AntdDatePicker({ value, onChange, id }: AntdDatePickerProps) {
  const today = dayjs();
  const yesterday = dayjs().subtract(1, "day");
  return (
    <DatePicker
      id={id}
      value={value ? dayjs(value) : null}
      allowClear={false}
      presets={[
        { label: "今天", value: today },
        { label: "昨天", value: yesterday },
      ]}
      onChange={(d) =>
        onChange(
          d ? (d as Dayjs).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")
        )
      }
    />
  );
}
