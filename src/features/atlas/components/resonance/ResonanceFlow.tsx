"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { EMOTION_OPTIONS } from "@/features/records/types";
import { cn } from "@/shared/utils/cn";
import {
  axisDate,
  buildDominantStops,
  buildEnvFrame,
  buildTimeTicks,
  CHART_H,
  CHART_W,
  envAt,
  PAD_B,
  PAD_L,
  PAD_T,
  PLOT_H,
  PLOT_W,
  tOf,
  waveAt,
  waveTagOrder,
  xOf,
  yOfCoherence,
  type EnvFrame,
  type GradientStop,
  type TimeTick,
} from "./chartFrame";
import { SliceMarkers } from "./SliceMarkers";
import type {
  ResonanceSeries,
  ResonanceSlice,
  TimeDomain,
} from "./types";

interface WavePathData {
  tag: EmotionTag;
  label: string;
  color: string;
  d: string;
  coreOpacity: number;
  glowOpacity: number;
}

interface SlicePosition {
  index: number;
  x: number;
  bandWidth: number;
}

/** Hover payload rendered by the parent as an HTML reading card. */
export interface SliceHoverInfo {
  slice: ResonanceSlice;
  /** Pointer position in CSS pixels relative to the chart canvas. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Max distance in viewBox px for a pointer to count as "on" a slice. */
const MAX_HOVER_DIST = 46;

interface ViewPoint {
  vx: number;
  vy: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Client → viewBox coordinates. The SVG uses the default
 * `xMidYMid meet` aspect ratio, so letterbox margins must be accounted for,
 * otherwise hover/click targets drift away from the cursor on wide screens.
 */
function toViewPoint(
  el: SVGSVGElement | null,
  clientX: number,
  clientY: number
): ViewPoint | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const scale = Math.min(rect.width / CHART_W, rect.height / CHART_H);
  const ox = (rect.width - CHART_W * scale) / 2;
  const oy = (rect.height - CHART_H * scale) / 2;
  return {
    vx: (clientX - rect.left - ox) / scale,
    vy: (clientY - rect.top - oy) / scale,
    x: clientX - rect.left,
    y: clientY - rect.top,
    w: rect.width,
    h: rect.height,
  };
}

function nearestSliceIndex(
  positions: SlicePosition[],
  vx: number
): number | null {
  let best: number | null = null;
  let dist = MAX_HOVER_DIST;
  for (const p of positions) {
    const d = Math.abs(p.x - vx);
    if (d < dist) {
      dist = d;
      best = p.index;
    }
  }
  return best;
}

function emotionLabel(tag: EmotionTag): string {
  return EMOTION_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
}

interface FlowView {
  envelopeD: string;
  stops: GradientStop[];
  waves: WavePathData[];
  ticks: TimeTick[];
  slicePositions: SlicePosition[];
}

interface ResonanceFlowProps {
  series: ResonanceSeries;
  domain: TimeDomain;
  /** Playback growth 0..1 (1 = fully drawn). */
  progress: number;
  playing: boolean;
  speed: number;
  reducedMotion: boolean;
  granularity: "day" | "week";
  highlightEmotion: EmotionTag | null;
  selectedSlice: number | null;
  onSelectSlice: (index: number | null) => void;
  /** Zoom by factor (<1 in) around an anchor time. */
  onZoom: (factor: number, anchorT: number) => void;
  /** Shift the visible window by a time delta (pan). */
  onPanShift: (deltaT: number) => void;
  /** Show/hide the plain-language hover card for a slice. */
  onHoverChange: (info: SliceHoverInfo | null) => void;
  svgRef: React.RefObject<SVGSVGElement>;
}

/** Amplitude 0..1 is expressed in coherence-axis units → px factor. */
const AMPLITUDE_PX = PLOT_H / 2;

function coherenceTickLabel(c: number): string {
  if (c === 1) return "+1 共振";
  if (c === -1) return "-1 拉扯";
  return `${c > 0 ? "+" : ""}${c}`;
}

function buildFlowView(
  series: ResonanceSeries,
  domain: TimeDomain,
  frame: EnvFrame,
  highlightEmotion: EmotionTag | null,
  granularity: "day" | "week",
  motion: number,
  animate: boolean
): FlowView {
  const step = Math.max(2, PLOT_W / 240);
  const sampleCount = Math.ceil(PLOT_W / step);

  // Per-sample caches shared by the envelope and all sub-waves.
  const envY: number[] = new Array(sampleCount + 1).fill(0);
  const penUps: boolean[] = new Array(sampleCount + 1).fill(false);
  const conflicts: number[] = new Array(sampleCount + 1).fill(0);
  const gaps: number[] = new Array(sampleCount + 1).fill(0);
  const sparses: number[] = new Array(sampleCount + 1).fill(1);

  for (let i = 0; i <= sampleCount; i++) {
    const x = PAD_L + Math.min(PLOT_W, i * step);
    const t = tOf(x, domain);
    const s = envAt(frame, t);
    const conflict = Math.min(1, Math.max(0, -s.coh * 2));
    conflicts[i] = conflict;
    gaps[i] = s.gap;
    sparses[i] = s.sparse;
    const inGap = s.gap > 0.5;
    penUps[i] = inGap;
    const rough =
      Math.max(0, -s.coh) *
      (PLOT_H * 0.016) *
      (Math.sin(x * 0.83) + 0.6 * Math.sin(x * 0.211));
    const jitter = animate
      ? conflict * 1.4 * Math.sin(motion * 3.1 + x * 0.7)
      : 0;
    // Inside gaps the base stays at the raw coherence line (no roughness),
    // so sub-waves have a sane center while their amplitude fades to zero.
    envY[i] =
      yOfCoherence(s.coh) + (inGap ? 0 : rough + jitter);
  }

  // Envelope main line: smooth in resonance, jagged in conflict, broken in gaps.
  let envelopeD = "";
  let penUp = true;
  for (let i = 0; i <= sampleCount; i++) {
    if (penUps[i]) {
      penUp = true;
      continue;
    }
    const x = PAD_L + Math.min(PLOT_W, i * step);
    envelopeD += `${penUp ? "M" : "L"} ${x.toFixed(1)} ${envY[i].toFixed(1)} `;
    penUp = false;
  }

  // Sub-waves: one independent strand per emotion / inner voice.
  const tagColors = new Map<EmotionTag, string>();
  for (const slice of series.slices) {
    for (const w of slice.subWaves) {
      if (!tagColors.has(w.tag)) tagColors.set(w.tag, w.color);
    }
  }

  const tags = waveTagOrder(frame);
  const waves: WavePathData[] = tags.map((tag) => {
    const parts: string[] = [];
    for (let i = 0; i <= sampleCount; i++) {
      const x = PAD_L + Math.min(PLOT_W, i * step);
      const t = tOf(x, domain);
      const w = waveAt(frame, tag, t);
      const conflict = conflicts[i];
      const dirSign = w.dir < 0 ? -1 : 1;
      const effAmp = w.amp * (1 - gaps[i]) * sparses[i];
      const breathAmp = 0.05 + 0.11 * conflict;
      const rate = dirSign < 0 ? -1.7 : 1.15;
      const mod = animate ? 1 + breathAmp * Math.sin(motion * rate) : 1;
      const jag =
        conflict *
        (animate ? 2.2 : 1.2) *
        Math.sin(x * 0.9 + motion * 2.6 * dirSign + (dirSign < 0 ? Math.PI : 0)) *
        dirSign;
      const y =
        envY[i] + dirSign * effAmp * mod * AMPLITUDE_PX + jag;
      parts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const matches =
      highlightEmotion === null || highlightEmotion === tag;
    return {
      tag,
      label: emotionLabel(tag),
      color: tagColors.get(tag) ?? "#9aa0a6",
      d: `M ${parts.join(" L ")}`,
      coreOpacity: matches ? 0.78 : 0.1,
      glowOpacity: matches ? 0.12 : 0.02,
    };
  });

  const slicePositions: SlicePosition[] = series.slices.map((slice, i) => {
    const x = xOf(slice.t, domain);
    const nextT = series.slices[i + 1]?.t;
    const prevT = series.slices[i - 1]?.t;
    const spacingT = Math.min(
      nextT !== undefined ? nextT - slice.t : Number.POSITIVE_INFINITY,
      prevT !== undefined ? slice.t - prevT : Number.POSITIVE_INFINITY
    );
    const ratio =
      Number.isFinite(spacingT) && domain.d1 > domain.d0
        ? spacingT / (domain.d1 - domain.d0)
        : 0.02;
    return {
      index: slice.index,
      x,
      bandWidth: Math.max(8, Math.min(64, (ratio * PLOT_W) / 2)),
    };
  });

  return {
    envelopeD,
    stops: buildDominantStops(series, domain),
    waves,
    ticks: buildTimeTicks(series, domain, granularity),
    slicePositions,
  };
}

export function ResonanceFlow({
  series,
  domain,
  progress,
  playing,
  speed,
  reducedMotion,
  granularity,
  highlightEmotion,
  selectedSlice,
  onSelectSlice,
  onZoom,
  onPanShift,
  onHoverChange,
  svgRef,
}: ResonanceFlowProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [motion, setMotion] = useState(0);
  const motionRef = useRef(0);
  const panRef = useRef<{ lastVx: number; movedPx: number } | null>(null);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const hoverIndexRef = useRef<number | null>(null);

  const animate = playing && !reducedMotion;

  // Breathing / conflict-oscillation clock; runs only during playback so a
  // paused chart is a truly frozen picture.
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      motionRef.current += dt * (0.9 + speed * 0.6);
      setMotion(motionRef.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate, speed]);

  const frame = useMemo(() => buildEnvFrame(series), [series]);
  const view = useMemo(
    () =>
      buildFlowView(
        series,
        domain,
        frame,
        highlightEmotion,
        granularity,
        motion,
        animate
      ),
    [series, domain, frame, highlightEmotion, granularity, motion, animate]
  );

  // Non-passive wheel zoom (zooms the time axis around the cursor).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toViewPoint(el, e.clientX, e.clientY);
      const vx = p?.vx ?? PAD_L + PLOT_W / 2;
      const clampedVx = Math.min(PAD_L + PLOT_W, Math.max(PAD_L, vx));
      onZoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, tOf(clampedVx, domain));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [domain, onZoom, svgRef]);

  function viewPointOf(e: React.PointerEvent<SVGSVGElement>): ViewPoint | null {
    return toViewPoint(svgRef.current, e.clientX, e.clientY);
  }

  function inPlot(p: ViewPoint): boolean {
    return (
      p.vx >= PAD_L &&
      p.vx <= PAD_L + PLOT_W &&
      p.vy >= PAD_T &&
      p.vy <= PAD_T + PLOT_H
    );
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return;
    suppressClickRef.current = false;
    panRef.current = { lastVx: viewPointOf(e)?.vx ?? 0, movedPx: 0 };
    hoverIndexRef.current = null;
    onHoverChange(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const p = viewPointOf(e);
    if (!p) return;
    const pan = panRef.current;
    if (!pan) {
      // Hover anywhere in the plot explains that moment in plain language.
      // Only notify when the slice changes, so pointer moves don't re-render
      // the whole view on every frame.
      const index = inPlot(p) ? nearestSliceIndex(view.slicePositions, p.vx) : null;
      if (index === hoverIndexRef.current) return;
      hoverIndexRef.current = index;
      const slice = index === null ? null : series.slices[index];
      onHoverChange(
        slice ? { slice, x: p.x, y: p.y, w: p.w, h: p.h } : null
      );
      return;
    }
    const dx = p.vx - pan.lastVx;
    pan.lastVx = p.vx;
    pan.movedPx += Math.abs(dx);
    if (pan.movedPx > 4) {
      suppressClickRef.current = true;
      const span = domain.d1 - domain.d0;
      onPanShift(-(dx / PLOT_W) * span);
    }
  }

  function handlePointerUp(
    e: React.PointerEvent<SVGSVGElement>,
    allowSelect = true
  ) {
    if (!panRef.current) return;
    const wasClick = panRef.current.movedPx <= 4;
    panRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture may already be released
    }
    if (!allowSelect || !wasClick || suppressClickRef.current) return;
    const p = viewPointOf(e);
    const index = p && inPlot(p) ? nearestSliceIndex(view.slicePositions, p.vx) : null;
    onSelectSlice(index);
  }

  function handlePointerLeave(e: React.PointerEvent<SVGSVGElement>) {
    handlePointerUp(e, false);
    hoverIndexRef.current = null;
    onHoverChange(null);
  }

  const clipWidth = Math.max(0, progress * PLOT_W);
  const band =
    selectedSlice !== null
      ? view.slicePositions.find((p) => p.index === selectedSlice)
      : undefined;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className={cn(
        "resonance-svg",
        dragging && "dragging",
        reducedMotion && "res-static"
      )}
      role="img"
      aria-label={`时序心理共振流图：${series.meta.sliceCount} 个时间切片。横轴为时间，纵轴为相干度，+1 表示感受与想法一致，-1 表示几种情绪互相拉扯；彩色细线各代表一种情绪。悬停可查看解释，点击可打开原始记录。`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => handlePointerUp(e)}
      onPointerLeave={handlePointerLeave}
    >
      <defs>
        <linearGradient
          id={`${uid}-env`}
          gradientUnits="userSpaceOnUse"
          x1={PAD_L}
          y1={0}
          x2={PAD_L + PLOT_W}
          y2={0}
        >
          {view.stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x={PAD_L} y={0} width={clipWidth} height={CHART_H} />
        </clipPath>
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

      {/* Coherence axis */}
      {[1, 0.5, 0, -0.5, -1].map((c) => (
        <g key={c}>
          {c === 0 ? (
            <line
              x1={PAD_L}
              x2={PAD_L + PLOT_W}
              y1={yOfCoherence(0)}
              y2={yOfCoherence(0)}
              stroke="var(--border-strong)"
              strokeDasharray="5 6"
              strokeWidth={1}
            />
          ) : null}
          <line
            x1={PAD_L - 6}
            x2={PAD_L}
            y1={yOfCoherence(c)}
            y2={yOfCoherence(c)}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 10}
            y={yOfCoherence(c) + 4}
            textAnchor="end"
            fontSize={11}
            fill="var(--text-faint)"
          >
            {coherenceTickLabel(c)}
          </text>
        </g>
      ))}

      {/* Time axis */}
      {view.ticks.map((tick, i) => (
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

      {/* Selected slice highlight band */}
      {band ? (
        <rect
          x={band.x - band.bandWidth / 2}
          y={PAD_T}
          width={band.bandWidth}
          height={PLOT_H}
          fill="rgba(110, 168, 254, 0.08)"
          stroke="rgba(110, 168, 254, 0.35)"
          strokeWidth={1}
          rx={4}
        />
      ) : null}

      {/* Layers revealed by playback progress, bottom → top */}
      <g clipPath={`url(#${uid}-clip)`} data-progress-group="true">
        {view.waves.map((w) => (
          <g key={w.tag}>
            <title>{`${w.label}：一股彩色细线代表一种情绪，离粗线越远表示这种情绪越强`}</title>
            <path
              d={w.d}
              fill="none"
              stroke={w.color}
              strokeWidth={4.5}
              opacity={w.glowOpacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={w.d}
              fill="none"
              stroke={w.color}
              strokeWidth={1.6}
              opacity={w.coreOpacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
        <path
          d={view.envelopeD}
          fill="none"
          stroke={`url(#${uid}-env)`}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>粗线＝相干度走势：越高越自洽，越低越拉扯。颜色是当时最主导的情绪。</title>
        </path>
        <SliceMarkers
          slices={series.slices}
          domain={domain}
          yAt={(s) => yOfCoherence(s.coherence)}
          selectedSlice={selectedSlice}
          onSelectSlice={onSelectSlice}
          shouldIgnoreClick={() => suppressClickRef.current}
        />
      </g>

      {/* Playback leading edge */}
      {progress > 0 && progress < 1 ? (
        <line
          x1={PAD_L + clipWidth}
          x2={PAD_L + clipWidth}
          y1={PAD_T}
          y2={PAD_T + PLOT_H}
          stroke="var(--accent)"
          strokeWidth={1}
          opacity={0.4}
        />
      ) : null}

      {/* Visible axis explanations. Colors are inlined (not CSS vars) so the
          exported PNG keeps them — external stylesheets aren't serialized. */}
      <g pointerEvents="none">
        <rect x={PAD_L + 6} y={PAD_T + 4} width={350} height={20} rx={4} fill="#0b0f1a" opacity={0.8} />
        <text x={PAD_L + 12} y={PAD_T + 18} fontSize={11.5} fill="#9aa6bd">
          纵轴 · 相干度：↑ 越高，感受与想法越一致（共振自洽）
        </text>
        <rect
          x={PAD_L + 6}
          y={PAD_T + PLOT_H - 26}
          width={300}
          height={20}
          rx={4}
          fill="#0b0f1a"
          opacity={0.8}
        />
        <text
          x={PAD_L + 12}
          y={PAD_T + PLOT_H - 12}
          fontSize={11.5}
          fill="#9aa6bd"
        >
          ↓ 越低，几种情绪越互相拉扯（失谐）
        </text>
        <text
          x={PAD_L + PLOT_W - 10}
          y={yOfCoherence(0) - 8}
          textAnchor="end"
          fontSize={11}
          fill="#6c788f"
        >
          0 · 中性
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
          点击图上任意时刻，查看当时的原始记录
        </text>
      </g>
    </svg>
  );
}
