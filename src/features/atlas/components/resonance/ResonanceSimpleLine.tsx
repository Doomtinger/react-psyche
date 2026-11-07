"use client";

import { useId, useMemo } from "react";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import {
  axisDate,
  axisDateTime,
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
import { STATE_LABELS } from "./resonanceEngine";
import { SliceMarkers } from "./SliceMarkers";
import type { ResonanceSeries, ResonanceSlice, TimeDomain } from "./types";

interface ResonanceSimpleLineProps {
  series: ResonanceSeries;
  domain: TimeDomain;
  granularity: "day" | "week";
  highlightEmotion: EmotionTag | null;
  selectedSlice: number | null;
  onSelectSlice: (index: number | null) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

function dotTooltip(slice: ResonanceSlice): string {
  const emotions = slice.emotions.map((e) => e.label).join("、") || "未标注";
  return [
    axisDateTime(slice.t),
    `强度 ${Math.round(slice.intensity * 10)}/10（由记录时的 1–5 档换算，不是评分）`,
    `情绪：${emotions} · 状态：${STATE_LABELS[slice.state]}`,
    "点击打开这条原始记录",
    slice.excerpt,
  ]
    .filter(Boolean)
    .join("\n");
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
  highlightEmotion,
  selectedSlice,
  onSelectSlice,
  svgRef,
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
      ref={svgRef}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="resonance-svg"
      role="img"
      aria-label={`简易情绪折线图：${series.meta.sliceCount} 个时间切片。横轴为时间，纵轴为情绪强度 0 到 10；圆点颜色代表当时的主导情绪，点击圆点可查看原始记录。`}
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
            <title>{tick.detail}</title>
          </text>
        </g>
      ))}

      <path
        d={dashedD}
        fill="none"
        stroke="var(--text-faint)"
        strokeWidth={1.4}
        strokeDasharray="4 5"
      >
        <title>灰色虚线：长时间没有记录或当时写成麻木，缺失不代表平静</title>
      </path>
      <path
        d={solidD}
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <title>实线＝情绪强度走势，越高表示那次记录的情绪越强；颜色是当时最主导的情绪</title>
      </path>

      {series.slices.map((slice) => {
        const dimmed =
          highlightEmotion !== null &&
          slice.emotions[0]?.tag !== highlightEmotion;
        return (
          <circle
            key={slice.index}
            cx={xOf(slice.t, domain)}
            cy={yOfNorm(slice.intensity)}
            r={selectedSlice === slice.index ? 4.5 : 2.6}
            fill={slice.emotions[0]?.color ?? "#9aa0a6"}
            opacity={slice.isGap || dimmed ? 0.25 : 0.9}
            stroke={
              selectedSlice === slice.index ? "var(--accent)" : "none"
            }
            strokeWidth={selectedSlice === slice.index ? 1.6 : 0}
            onClick={() => onSelectSlice(slice.index)}
            className="res-hit"
          >
            <title>{dotTooltip(slice)}</title>
          </circle>
        );
      })}

      <SliceMarkers
        slices={series.slices}
        domain={domain}
        yAt={(s) => yOfNorm(s.intensity)}
        selectedSlice={selectedSlice}
        onSelectSlice={onSelectSlice}
      />

      <g pointerEvents="none">
        <rect x={PAD_L + 6} y={PAD_T + 4} width={380} height={20} rx={4} fill="#0b0f1a" opacity={0.8} />
        <text x={PAD_L + 12} y={PAD_T + 18} fontSize={11.5} fill="#9aa6bd">
          纵轴 · 情绪强度：↑ 越高，那次记录里的情绪越强（0–10 为换算值）
        </text>
        <text x={PAD_L} y={CHART_H - 10} fontSize={11} fill="#6c788f">
          {`横轴 · 时间 →　${axisDate(domain.d0)} — ${axisDate(domain.d1)}`}
        </text>
        <text
          x={PAD_L + PLOT_W}
          y={CHART_H - 10}
          textAnchor="end"
          fontSize={11}
          fill="#6c788f"
        >
          圆点＝一次记录 · 点击可查看原文
        </text>
      </g>
    </svg>
  );
}
