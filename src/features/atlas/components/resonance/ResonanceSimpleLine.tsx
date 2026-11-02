"use client";

import { useId, useMemo } from "react";
import {
  buildDominantStops,
  buildTimeTicks,
  CHART_H,
  CHART_W,
  PAD_B,
  PAD_L,
  PAD_T,
  PLOT_H,
  PLOT_W,
  xOf,
  yOfNorm,
} from "./chartFrame";
import { SliceMarkers } from "./SliceMarkers";
import type { ResonanceSeries, TimeDomain } from "./types";

interface ResonanceSimpleLineProps {
  series: ResonanceSeries;
  domain: TimeDomain;
  granularity: "day" | "week";
  selectedSlice: number | null;
  onSelectSlice: (index: number | null) => void;
}

function intensityTickLabel(v: number): string {
  if (v === 1) return "10 强度";
  return `${v * 10}`;
}

/**
 * 简易降级折线图: a traditional single-line emotion-intensity chart for users
 * who find the multi-strand resonance view visually heavy. Same time axis,
 * same dominant-emotion colors — only the encoding is simplified.
 */
export function ResonanceSimpleLine({
  series,
  domain,
  granularity,
  selectedSlice,
  onSelectSlice,
}: ResonanceSimpleLineProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const { solidD, dashedD } = useMemo(() => {
    const slices = series.slices;
    let solid = "";
    let dashed = "";
    for (let i = 0; i < slices.length - 1; i++) {
      const a = slices[i];
      const b = slices[i + 1];
      const seg = `M ${xOf(a.t, domain).toFixed(1)} ${yOfNorm(a.intensity).toFixed(1)} L ${xOf(
        b.t,
        domain
      ).toFixed(1)} ${yOfNorm(b.intensity).toFixed(1)} `;
      if (a.isGap || b.isGap) dashed += seg;
      else solid += seg;
    }
    return { solidD: solid, dashedD: dashed };
  }, [series, domain]);

  const stops = useMemo(() => buildDominantStops(series, domain), [series, domain]);
  const ticks = useMemo(
    () => buildTimeTicks(series, domain, granularity),
    [series, domain, granularity]
  );

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="resonance-svg"
      role="img"
      aria-label={`简易情绪折线图：${series.meta.sliceCount} 个时间切片，纵轴为情绪强度 0 到 10`}
    >
      <defs>
        <linearGradient
          id={`${uid}-line`}
          gradientUnits="userSpaceOnUse"
          x1={PAD_L}
          y1={0}
          x2={PAD_L + PLOT_W}
          y2={0}
        >
          {stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>

      <rect width={CHART_W} height={CHART_H} fill="#0b0f1a" />

      <rect
        x={PAD_L}
        y={PAD_T}
        width={PLOT_W}
        height={PLOT_H}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
      />

      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line
            x1={PAD_L - 6}
            x2={PAD_L}
            y1={yOfNorm(v)}
            y2={yOfNorm(v)}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 10}
            y={yOfNorm(v) + 4}
            textAnchor="end"
            fontSize={11}
            fill="var(--text-faint)"
          >
            {intensityTickLabel(v)}
          </text>
        </g>
      ))}

      {ticks.map((tick, i) => (
        <g key={i}>
          <line
            x1={tick.x}
            x2={tick.x}
            y1={PAD_T}
            y2={PAD_T + PLOT_H}
            stroke="var(--border)"
            strokeDasharray="2 6"
            strokeWidth={1}
          />
          <text
            x={tick.x}
            y={CHART_H - PAD_B + 20}
            textAnchor="middle"
            fontSize={11}
            fill="var(--text-faint)"
          >
            {tick.label}
          </text>
        </g>
      ))}

      <path
        d={dashedD}
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth={1.4}
        strokeDasharray="4 5"
      />
      <path
        d={solidD}
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {series.slices.map((slice) => (
        <circle
          key={slice.index}
          cx={xOf(slice.t, domain)}
          cy={yOfNorm(slice.intensity)}
          r={selectedSlice === slice.index ? 4.5 : 2.6}
          fill={slice.emotions[0]?.color ?? "#9aa0a6"}
          opacity={slice.isGap ? 0.25 : 0.9}
          stroke={
            selectedSlice === slice.index ? "var(--accent)" : "none"
          }
          strokeWidth={selectedSlice === slice.index ? 1.6 : 0}
          onClick={() => onSelectSlice(slice.index)}
          className="res-hit"
        >
          <title>{`强度 ${Math.round(slice.intensity * 10)}/10${slice.excerpt ? ` · ${slice.excerpt}` : ""}`}</title>
        </circle>
      ))}

      <SliceMarkers
        slices={series.slices}
        domain={domain}
        yAt={(s) => yOfNorm(s.intensity)}
        selectedSlice={selectedSlice}
        onSelectSlice={onSelectSlice}
      />
    </svg>
  );
}
