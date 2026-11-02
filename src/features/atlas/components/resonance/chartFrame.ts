import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { shadeForCoherence } from "./colors";
import { SPARSE_GAP_MS } from "./resonanceEngine";
import type { ResonanceSeries, ResonanceSlice, TimeDomain } from "./types";

/**
 * Shared chart frame for the resonance flow: viewBox geometry, coordinate
 * mappings, slice interpolation and axis ticks. Used by both the complex
 * resonance chart and the degraded simple line view, so switching views keeps
 * the same spatial language.
 */

export const CHART_W = 1200;
export const CHART_H = 440;
export const PAD_L = 64;
export const PAD_R = 28;
export const PAD_T = 26;
export const PAD_B = 54;
export const PLOT_W = CHART_W - PAD_L - PAD_R;
export const PLOT_H = CHART_H - PAD_T - PAD_B;

export const MARKER_COLORS = {
  positive: "#4cc38a",
  negative: "#e0586b",
  weak: "#6c788f",
} as const;

export function xOf(t: number, domain: TimeDomain): number {
  const span = Math.max(1, domain.d1 - domain.d0);
  const ratio = (t - domain.d0) / span;
  return PAD_L + Math.min(1, Math.max(0, ratio)) * PLOT_W;
}

export function tOf(x: number, domain: TimeDomain): number {
  const ratio = (x - PAD_L) / PLOT_W;
  return domain.d0 + ratio * (domain.d1 - domain.d0);
}

/** Coherence (-1..+1) → viewBox y. Top = +1 (共振), bottom = -1 (失谐). */
export function yOfCoherence(coherence: number): number {
  const c = Math.min(1, Math.max(-1, coherence));
  return PAD_T + ((1 - c) / 2) * PLOT_H;
}

/** Normalized 0..1 (simple-view intensity) → viewBox y. */
export function yOfNorm(v: number): number {
  return PAD_T + (1 - Math.min(1, Math.max(0, v))) * PLOT_H;
}

interface WaveIndexParams {
  amp: number;
  phase: number;
  dir: number; // +1 aligned, -1 opposing
}

export interface EnvFrame {
  ts: number[];
  cohs: number[];
  gaps: number[];
  waves: Map<EmotionTag, WaveIndexParams>[];
  slices: ResonanceSlice[];
}

/** Preprocessed slice arrays for fast sampling along the time axis. */
export function buildEnvFrame(series: ResonanceSeries): EnvFrame {
  const slices = series.slices;
  const waves = slices.map((slice) => {
    const m = new Map<EmotionTag, WaveIndexParams>();
    for (const w of slice.subWaves) {
      m.set(w.tag, {
        amp: w.amplitude,
        phase: w.phase,
        dir: w.group === "opposing" ? -1 : 1,
      });
    }
    return m;
  });
  return {
    ts: slices.map((s) => s.t),
    cohs: slices.map((s) => s.coherence),
    gaps: slices.map((s) => (s.isGap ? 1 : 0)),
    waves,
    slices,
  };
}

function bracketIndex(frame: EnvFrame, t: number): number {
  const { ts } = frame;
  const n = ts.length;
  if (n === 0) return -1;
  if (t <= ts[0]) return 0;
  if (t >= ts[n - 1]) return n - 1;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= t) lo = mid;
    else hi = mid;
  }
  return lo;
}

function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}

function lerpAngle(a: number, b: number, f: number): number {
  const TAU = Math.PI * 2;
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * f;
}

export interface EnvSample {
  coh: number;
  /** 0 (normal) .. 1 (fully inside a numbness gap). */
  gap: number;
  /** 1 normal .. fades to ~0.2 across long record-less stretches. */
  sparse: number;
  /** Index of the left bracketing slice. */
  index: number;
}

export function envAt(frame: EnvFrame, t: number): EnvSample {
  const n = frame.ts.length;
  if (n === 0) return { coh: 0, gap: 0, sparse: 1, index: 0 };
  if (n === 1) {
    return { coh: frame.cohs[0], gap: frame.gaps[0], sparse: 1, index: 0 };
  }
  const i = bracketIndex(frame, t);
  const j = Math.min(i + 1, n - 1);
  if (i === j) {
    return { coh: frame.cohs[i], gap: frame.gaps[i], sparse: 1, index: i };
  }
  const span = frame.ts[j] - frame.ts[i];
  const f = Math.min(1, Math.max(0, (t - frame.ts[i]) / span));
  const spacing = span;
  let sparse = 1;
  if (spacing > SPARSE_GAP_MS) {
    const dip = Math.min(0.8, spacing / SPARSE_GAP_MS - 1);
    sparse = 1 - dip * Math.sin(Math.PI * f);
  }
  return {
    coh: lerp(frame.cohs[i], frame.cohs[j], f),
    gap: lerp(frame.gaps[i], frame.gaps[j], f),
    sparse,
    index: i,
  };
}

export function waveAt(
  frame: EnvFrame,
  tag: EmotionTag,
  t: number
): WaveIndexParams {
  const n = frame.ts.length;
  const fallback: WaveIndexParams = { amp: 0, phase: 0, dir: 1 };
  if (n === 0) return fallback;
  if (n === 1) return frame.waves[0].get(tag) ?? fallback;
  const i = bracketIndex(frame, t);
  const j = Math.min(i + 1, n - 1);
  const a = frame.waves[i].get(tag);
  const b = frame.waves[j].get(tag);
  if (!a && !b) return fallback;
  if (i === j) return a ?? b ?? fallback;
  const span = frame.ts[j] - frame.ts[i];
  const f = Math.min(1, Math.max(0, (t - frame.ts[i]) / span));
  if (a && !b) return { amp: lerp(a.amp, 0, f), phase: a.phase, dir: a.dir };
  if (!a && b) return { amp: lerp(0, b.amp, f), phase: b.phase, dir: b.dir };
  return {
    amp: lerp(a!.amp, b!.amp, f),
    phase: lerpAngle(a!.phase, b!.phase, f),
    dir: lerp(a!.dir, b!.dir, f),
  };
}

/** Unique emotion tags across the series, strongest first. */
export function waveTagOrder(frame: EnvFrame): EmotionTag[] {
  const best = new Map<EmotionTag, number>();
  for (const map of frame.waves) {
    for (const [tag, params] of map) {
      best.set(tag, Math.max(best.get(tag) ?? 0, params.amp));
    }
  }
  return [...best.entries()].sort((x, y) => y[1] - x[1]).map(([tag]) => tag);
}

export interface GradientStop {
  offset: number;
  color: string;
}

/**
 * Horizontal gradient for the envelope line: dominant emotion color per slice,
 * shaded by that slice's coherence (柔和 in resonance, 暗沉 in conflict).
 */
export function buildDominantStops(
  series: ResonanceSeries,
  domain: TimeDomain
): GradientStop[] {
  const slices = series.slices;
  if (slices.length === 0) return [];
  const stops: GradientStop[] = [];
  let last = -1;
  const push = (offset: number, color: string) => {
    const off = Math.min(1, Math.max(0, offset));
    if (off > last) {
      stops.push({ offset: off, color });
      last = off;
    }
  };
  push(0, shadeForCoherence(slices[0].emotions[0]?.color ?? "#9aa0a6", slices[0].coherence));
  for (const slice of slices) {
    const off = (xOf(slice.t, domain) - PAD_L) / PLOT_W;
    push(
      off,
      shadeForCoherence(slice.emotions[0]?.color ?? "#9aa0a6", slice.coherence)
    );
  }
  return stops;
}

export interface TimeTick {
  x: number;
  label: string;
}

function weekStartKey(t: number): string {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function shortDay(t: number): string {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Time ticks at day or week granularity. Overcrowded labels are skipped
 * (noise reduction) — gridlines stay meaningful without flooding the axis.
 */
export function buildTimeTicks(
  series: ResonanceSeries,
  domain: TimeDomain,
  granularity: "day" | "week"
): TimeTick[] {
  const minGapPx = 52;
  const ticks: TimeTick[] = [];
  let lastX = -Infinity;
  let prevKey: string | null = null;
  for (const slice of series.slices) {
    const key =
      granularity === "day"
        ? new Date(slice.t).toDateString()
        : weekStartKey(slice.t);
    if (key === prevKey) continue;
    prevKey = key;
    const x = xOf(slice.t, domain);
    if (x < PAD_L - 1 || x > PAD_L + PLOT_W + 1) continue;
    if (x - lastX < minGapPx && ticks.length > 0) continue;
    lastX = x;
    ticks.push({ x, label: shortDay(slice.t) });
  }
  return ticks;
}
