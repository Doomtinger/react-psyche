import type { EmotionTag } from "@/domain/entities/MoodRecord";

/**
 * Contracts for the 时序心理共振流图 (temporal psychological resonance flow).
 *
 * This pipeline is intentionally independent from the single-sentence emotion
 * renderer and the 3D landscape: separate analysis model, layout rules and
 * interactions. Only the emotion color library is shared, so the product's
 * visual language stays consistent.
 *
 * Hard rule: these types describe *visual* encodings of self-reported
 * feelings. No diagnostic or clinical labels may be derived from them.
 */

/** Two counter-phase wave families used to encode inner conflict. */
export type WaveGroup = "aligned" | "opposing";

export interface SliceEmotion {
  tag: EmotionTag;
  label: string;
  /** Shared emotion color library (same as the single-sentence pipeline). */
  color: string;
  /** Engine strength on the requirement's 0..10 scale. */
  strengthRaw: number;
  /** Normalized 0..1 strength. */
  strength: number;
}

export interface SubWave extends SliceEmotion {
  /** Render layer, 0..n-1 ordered weakest → strongest (strongest outermost). */
  layer: number;
  group: WaveGroup;
  /** Base phase in radians. */
  phase: number;
  /** Phase offset relative to the slice's primary wave, in (-π, π]. */
  phaseDiff: number;
  /** Render amplitude in coherence-axis units (0..~0.95). */
  amplitude: number;
}

export type PerturbationKind =
  | "none"
  | "weak"
  | "strong-positive"
  | "strong-negative";

export interface SlicePerturbation {
  kind: PerturbationKind;
  /** Human-readable summary (#event tags or note excerpt). */
  summary: string;
}

export type SliceState =
  | "resonant" // 共振自洽：子波相位对齐、舒展
  | "conflict" // 失谐拉扯：子波反向交叉、震荡
  | "isolation" // 隔离断层：波纹消散、主线留白
  | "eruption"; // 延迟爆发：断层后振幅骤升

export type SliceTrend = "stable" | "converging" | "looping";

export interface ResonanceSlice {
  index: number;
  /** Epoch ms of the slice anchor (latest record inside the slice). */
  t: number;
  recordIds: string[];
  /** Coherence vector, -1 (失谐) .. +1 (共振), 0 neutral. */
  coherence: number;
  state: SliceState;
  trend: SliceTrend;
  /** Normalized 0..1 overall emotional intensity of the slice. */
  intensity: number;
  /** Explicit emotion vector (multi-label allowed, capped at 5). */
  emotions: SliceEmotion[];
  /** Parallel sub-waves (one per emotion/inner voice, capped at 5). */
  subWaves: SubWave[];
  perturbation: SlicePerturbation;
  /** True → numbness gap: envelope breaks, sub-waves fade out. */
  isGap: boolean;
  /** First record id of the slice; used to open the original record. */
  primaryRecordId: string;
  /** Short original-text excerpt for tooltips, popups and export watermark. */
  excerpt: string;
}

export interface ResonanceSeriesMeta {
  /** Number of source records consumed. */
  recordCount: number;
  sliceCount: number;
  /** True when >90 records were merged into ≤90 slices. */
  downsampled: boolean;
  from: number;
  to: number;
}

export interface ResonanceSeries {
  slices: ResonanceSlice[];
  meta: ResonanceSeriesMeta;
}

export interface TimeDomain {
  d0: number;
  d1: number;
}
