import { EMOTION_TAGS, type EmotionTag, type MoodRecord } from "@/domain/entities/MoodRecord";
import { EMOTION_OPTIONS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import {
  ACCEPTANCE_WORDS,
  AMBIGUOUS_TAGS,
  EMOTION_KEYWORDS,
  NEGATIVE_TAGS,
  NUMBNESS_WORDS,
  POSITIVE_TAGS,
  STRONG_EVENT_WORDS,
  SUPPRESSION_WORDS,
} from "./lexicon";
import type {
  ResonanceSeries,
  ResonanceSlice,
  ResonanceSeriesMeta,
  SliceEmotion,
  SlicePerturbation,
  SliceState,
  SliceTrend,
  SubWave,
  WaveGroup,
} from "./types";

/**
 * 时序心理共振流图 analysis engine.
 *
 * Turns an ordered series of MoodRecords into per-time-slice "vector packs"
 * (parallel sub-wave parameters) consumed by the resonance renderer. Pure and
 * deterministic: identical inputs always yield identical slices.
 *
 * Dimension mapping from the requirement document:
 * 1. 显性情绪向量  → multi-label `emotions` (strength 0..10 each).
 * 2. 相干/冲突向量 → `coherence` in [-1, +1] from acceptance/suppression
 *    lexicons and same/opposite valence mixes.
 * 3. 扰动因子      → `perturbation` (strong/weak, positive/negative).
 * 4. 时序延续性    → sliding-window trends: converging repair, looping
 *    rumination, numbness gaps and delayed eruptions.
 *
 * Only shared with the rest of the app: the emotion color library. No
 * diagnostic labels are produced.
 */

const TAU = Math.PI * 2;

/** Sub-wave cap per slice; extra emotions are folded into the weakest wave. */
export const MAX_SUB_WAVES = 5;
/** Above this record count the timeline is downsampled for performance. */
export const DOWNSAMPLE_THRESHOLD = 90;
export const MAX_SLICES = 90;

/** A gap starts to register after this much silence between anchors. */
export const SPARSE_GAP_MS = 48 * 60 * 60 * 1000;

const STRENGTH_DECAY = [1, 0.7, 0.55, 0.42, 0.32, 0.25] as const;
const KEYWORD_BOOST = 1.3;
const GOLDEN_ANGLE = 2.399963229728653;

export const STATE_LABELS: Record<SliceState, string> = {
  resonant: "共振自洽",
  conflict: "失谐拉扯",
  isolation: "隔离断层",
  eruption: "延迟爆发",
};

export const TREND_LABELS: Record<SliceTrend, string> = {
  stable: "平稳",
  converging: "逐步修复",
  looping: "循环内耗",
};

export const PERTURBATION_LABELS: Record<string, string> = {
  none: "无外部事件",
  weak: "弱扰动",
  "strong-positive": "正向冲击",
  "strong-negative": "负向冲击",
};

interface EmoStrength {
  tag: EmotionTag;
  label: string;
  color: string;
  raw: number;
}

interface RawSlice {
  record: MoodRecord;
  t: number;
  note: string;
  emotions: EmoStrength[];
  coherence: number;
  perturbation: SlicePerturbation;
  numb: boolean;
  eruption: boolean;
  intensity: number;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function emotionLabel(tag: EmotionTag): string {
  return EMOTION_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
}

function makeEmo(tag: EmotionTag, raw: number): EmoStrength {
  return {
    tag,
    label: emotionLabel(tag),
    color: emotionColor(tag),
    raw: round2(clamp(raw, 0, 10)),
  };
}

function countDistinctWords(text: string, words: readonly string[]): number {
  let hits = 0;
  for (const word of words) {
    if (word.length > 0 && text.includes(word)) hits += 1;
  }
  return hits;
}

function firstWordHit(text: string, words: readonly string[]): string | null {
  for (const word of words) {
    if (word.length > 0 && text.includes(word)) return word;
  }
  return null;
}

function isPositive(tag: EmotionTag): boolean {
  return POSITIVE_TAGS.includes(tag);
}

function isNegative(tag: EmotionTag): boolean {
  return NEGATIVE_TAGS.includes(tag);
}

/** Infer emotion tags from note keywords when a record has none attached. */
function inferTagsFromNote(note: string): EmotionTag[] {
  const scored: { tag: EmotionTag; hits: number }[] = [];
  for (const [tag, words] of Object.entries(EMOTION_KEYWORDS) as [
    EmotionTag,
    readonly string[],
  ][]) {
    const hits = countDistinctWords(note, words);
    if (hits > 0) scored.push({ tag, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);
  if (scored.length === 0) return ["other"];
  return scored.slice(0, 2).map((s) => s.tag);
}

/**
 * Dimension 1: explicit emotion vector. Multiple emotions coexist; strength
 * decays after the primary tag and is boosted when the note mentions the
 * emotion's own keywords.
 */
function extractEmotions(record: MoodRecord, note: string): EmoStrength[] {
  const base = 2 + record.intensity * 1.6;
  const tags =
    record.emotions.length > 0 ? record.emotions : inferTagsFromNote(note);

  const list: EmoStrength[] = tags.map((tag, idx) => {
    const decay = STRENGTH_DECAY[idx] ?? 0.25;
    let raw = base * decay;
    for (const keyword of EMOTION_KEYWORDS[tag] ?? []) {
      if (keyword.length > 0 && note.includes(keyword)) raw += KEYWORD_BOOST;
    }
    return makeEmo(tag, raw);
  });

  list.sort((a, b) => b.raw - a.raw);

  // Custom tags (其他 with a user-written label/color) keep their picked
  // color here, so resonance waves and the envelope match the rest of the UI.
  const customs = record.customEmotions ?? [];
  if (customs.length > 0) {
    for (const emo of list) {
      if (emo.tag === "other") {
        emo.label = customs[0].label;
        emo.color = customs[0].color;
      }
    }
  }

  // Merge emotions beyond the sub-wave cap into the weakest kept wave, so the
  // picture stays legible instead of dropping feelings silently.
  if (list.length > MAX_SUB_WAVES) {
    const kept = list.slice(0, MAX_SUB_WAVES);
    const overflow = list.slice(MAX_SUB_WAVES);
    const fold = overflow.reduce((sum, e) => sum + e.raw, 0);
    const tail = kept[kept.length - 1];
    tail.raw = round2(clamp(tail.raw + fold * 0.5, 0, 10));
    return kept;
  }
  return list;
}

/**
 * Dimension 2: inner coherence / conflict, -1..+1.
 * - thought accepts feeling → positive
 * - thought suppresses/denies feeling → negative
 * - multiple same-valence emotions → mildly positive
 * - opposite-valence emotions coexist → negative pull
 */
function coherenceOf(
  record: MoodRecord,
  note: string,
  emotions: EmoStrength[]
): number {
  let value = 0;

  const accept = countDistinctWords(note, ACCEPTANCE_WORDS);
  const suppress = countDistinctWords(note, SUPPRESSION_WORDS);
  value += 0.2 * Math.min(accept, 3);
  value -= 0.26 * Math.min(suppress, 3);

  const hasPositive = emotions.some((e) => isPositive(e.tag));
  const hasNegative = emotions.some((e) => isNegative(e.tag));
  const nonAmbiguous = emotions.filter(
    (e) => !AMBIGUOUS_TAGS.includes(e.tag)
  ).length;

  if (hasPositive && hasNegative) {
    // 对抗叠加：两种对立情绪共存
    value -= 0.32;
  } else if (nonAmbiguous >= 2) {
    // 多层混合：多种不矛盾情绪共存
    value += 0.18;
  }

  if (suppress > 0 && !hasPositive) value -= 0.06;

  return round2(clamp(value, -1, 1));
}

/**
 * Dimension 3: perturbation factor. Strong shocks allow waveform突变 in the
 * renderer; weak events produce small ripples; no event → smooth drift.
 */
function perturbationOf(record: MoodRecord, note: string): SlicePerturbation {
  const hasEventTags = record.eventTags.length > 0;
  const strongWord = firstWordHit(note, STRONG_EVENT_WORDS);
  const strong = strongWord !== null || (hasEventTags && record.intensity >= 4);

  if (!hasEventTags && strongWord === null) {
    return { kind: "none", summary: "" };
  }

  const primary = record.emotions[0];
  let kind: SlicePerturbation["kind"];
  if (strong) {
    kind = isNegative(primary) || primary === undefined
      ? "strong-negative"
      : isPositive(primary)
        ? "strong-positive"
        : "weak";
  } else {
    kind = "weak";
  }

  const summary =
    record.eventTags.length > 0
      ? record.eventTags.map((t) => `#${t}`).join(" ")
      : (strongWord ?? "");
  return { kind, summary };
}

function isNumb(note: string): boolean {
  return firstWordHit(note, NUMBNESS_WORDS) !== null;
}

function basePhase(tagIndex: number, sliceIndex: number): number {
  return (
    ((tagIndex + 1) * GOLDEN_ANGLE + sliceIndex * 2.100007) % TAU
  );
}

function shortestAngleDiff(angle: number): number {
  let a = angle % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

/** Build one ResonanceSlice from already-merged slice seeds. */
function assembleSlice(
  seeds: RawSlice[],
  index: number,
  t: number,
  coherence: number,
  emotionsRaw: EmoStrength[],
  perturbation: SlicePerturbation,
  isGap: boolean,
  eruptionFlag: boolean,
  intensity: number,
  excerpt: string
): ResonanceSlice {
  const emotions: SliceEmotion[] = emotionsRaw.map((e) => ({
    tag: e.tag,
    label: e.label,
    color: e.color,
    strengthRaw: e.raw,
    strength: round2(e.raw / 10),
  }));

  const hasPositive = emotionsRaw.some((e) => isPositive(e.tag));
  const conflictPull = coherence < -0.18 && !hasPositive;

  const maxLayer = emotions.length - 1;
  // Layer order runs weakest → strongest so the strongest wave sits outermost.
  const byWeakness = [...emotionsRaw].sort((a, b) => a.raw - b.raw);

  function groupOf(emo: SliceEmotion, layer: number): WaveGroup {
    if (isNegative(emo.tag) && hasPositive) return "opposing";
    if (conflictPull && layer % 2 === 1) return "opposing";
    return "aligned";
  }

  const phases = emotions.map((emo) => {
    const layer = byWeakness.findIndex((e) => e.tag === emo.tag);
    const tagIndex = Math.max(0, EMOTION_TAGS.indexOf(emo.tag));
    const group = groupOf(emo, layer);
    return (
      basePhase(tagIndex, index) +
      (group === "opposing" ? Math.PI : layer * 0.14)
    );
  });

  const primaryPhase = phases[0] ?? 0;

  function buildWave(emo: SliceEmotion, i: number): SubWave {
    const layer = byWeakness.findIndex((e) => e.tag === emo.tag);
    const layerNorm = maxLayer === 0 ? 1 : layer / maxLayer;
    const group = groupOf(emo, layer);
    const phase = phases[i];

    const stateAmp = stateAmpFactor(isGap, eruptionFlag, coherence);
    const amplitude = clamp(
      emo.strength *
        (0.45 + 0.55 * layerNorm) *
        (0.55 + 0.45 * intensity) *
        stateAmp,
      0,
      0.95
    );

    return {
      ...emo,
      layer,
      group,
      phase: round2(phase * 1000) / 1000,
      phaseDiff: round2(shortestAngleDiff(phase - primaryPhase) * 1000) / 1000,
      amplitude: round2(amplitude * 1000) / 1000,
    };
  }

  const subWaves: SubWave[] = emotions.map((emo, i) => buildWave(emo, i));

  // Deep dissonance with a single feeling means thought vs feeling are at
  // odds (想法与感受对抗) — split an anti-phase "inner voice" wave so the
  // conflict renders as two counter-oscillating strands.
  if (coherence <= -0.3 && emotions.length === 1 && !isGap) {
    const voice = subWaves[0];
    subWaves.push({
      ...voice,
      layer: voice.layer + 1,
      group: voice.group === "opposing" ? "aligned" : "opposing",
      phase: round2(((voice.phase + Math.PI) % TAU) * 1000) / 1000,
      phaseDiff: round2(Math.PI * 1000) / 1000,
      amplitude: round2(voice.amplitude * 0.72 * 1000) / 1000,
    });
  }

  return {
    index,
    t,
    recordIds: seeds.map((s) => s.record.id),
    coherence,
    state: sliceState(isGap, eruptionFlag, coherence),
    trend: "stable",
    intensity: round2(intensity),
    emotions,
    subWaves,
    perturbation,
    isGap,
    primaryRecordId: seeds[0]?.record.id ?? "",
    excerpt,
  };
}

function stateAmpFactor(isGap: boolean, eruption: boolean, coherence: number): number {
  if (isGap) return 0.05;
  if (eruption) return 1.7;
  return coherence < -0.18 ? 1.18 : 1;
}

function sliceState(
  isGap: boolean,
  eruption: boolean,
  coherence: number
): SliceState {
  if (isGap) return "isolation";
  if (eruption) return "eruption";
  return coherence >= 0 ? "resonant" : "conflict";
}

/**
 * Dimension 4 pass (record level): numbness gaps and delayed eruptions.
 * A gap registers when the text expresses numbness/emotional blank; an
 * eruption registers when intensity jumps sharply right after a gap run.
 */
function markGapsAndEruptions(raws: RawSlice[]): void {
  // A numbness slice (麻木/情感隔离) becomes a blank gap on its own; the
  // renderer breaks the envelope there regardless of whether a shock preceded
  // it, because the blank — not the shock — is what gets visualized.

  // Delayed eruption: first slice after a numbness run with a sharp intensity
  // jump and low coherence (冲突拉满), relative to the pre-gap baseline.
  let i = 0;
  while (i < raws.length) {
    if (!raws[i].numb) {
      i += 1;
      continue;
    }
    let end = i;
    while (end + 1 < raws.length && raws[end + 1].numb) end += 1;

    const preMean =
      raws
        .slice(Math.max(0, i - 3), i)
        .reduce((sum, s) => sum + s.intensity, 0) /
      Math.max(1, Math.min(3, i));

    const next = raws[end + 1];
    if (next && next.intensity >= preMean * 1.45 && next.coherence <= 0.2) {
      next.eruption = true;
    }
    i = end + 1;
  }
}

/** Dimension 4 pass (series level): sliding-window continuity trends. */
function markTrends(slices: ResonanceSlice[]): void {
  const coh = slices.map((s) => s.coherence);
  for (let i = 3; i < slices.length; i++) {
    const window = coh.slice(i - 3, i + 1);
    const slope = (coh[i] - coh[i - 3]) / 3;
    const mean = window.reduce((a, b) => a + b, 0) / 4;
    const diffs: number[] = [];
    for (let k = 1; k < window.length; k++) diffs.push(window[k] - window[k - 1]);
    let changes = 0;
    for (let k = 1; k < diffs.length; k++) {
      if (diffs[k - 1] * diffs[k] < 0) changes += 1;
    }

    if (slope >= 0.12 && coh[i] > -0.85) {
      slices[i].trend = "converging";
    } else if (changes >= 2 && mean < -0.05) {
      slices[i].trend = "looping";
    } else {
      slices[i].trend = "stable";
    }
  }
}

/** Merge raw slices into at most MAX_SLICES buckets (render-performance cap). */
function downsample(raws: RawSlice[]): RawSlice[][] {
  const bucketSize = Math.ceil(raws.length / MAX_SLICES);
  const buckets: RawSlice[][] = [];
  for (let i = 0; i < raws.length; i += bucketSize) {
    buckets.push(raws.slice(i, i + bucketSize));
  }
  return buckets;
}

function buildRawSlices(records: MoodRecord[]): RawSlice[] {
  const sorted = [...records]
    .filter((r) => Number.isFinite(new Date(r.recordedAt).getTime()))
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  return sorted.map((record) => {
    const note = record.note ?? "";
    const emotions = extractEmotions(record, note);
    return {
      record,
      t: new Date(record.recordedAt).getTime(),
      note,
      emotions,
      coherence: coherenceOf(record, note, emotions),
      perturbation: perturbationOf(record, note),
      numb: isNumb(note),
      eruption: false,
      intensity: round2((emotions[0]?.raw ?? 0) / 10),
    };
  });
}

function excerptOf(seeds: RawSlice[]): string {
  for (const s of seeds) {
    const text = (s.note ?? "").trim();
    if (text.length > 0) return text.slice(0, 80);
  }
  const tags = seeds.find((s) => s.record.eventTags.length > 0)?.record.eventTags;
  return tags ? tags.map((t) => `#${t}`).join(" ") : "";
}

function strongestPerturbation(seeds: RawSlice[]): SlicePerturbation {
  const rank: Record<string, number> = {
    "strong-negative": 4,
    "strong-positive": 3,
    weak: 2,
    none: 1,
  };
  let best = seeds[0]?.perturbation ?? { kind: "none" as const, summary: "" };
  for (const s of seeds) {
    if ((rank[s.perturbation.kind] ?? 0) > (rank[best.kind] ?? 0)) best = s.perturbation;
  }
  return best;
}

/**
 * Main entry: records → time-slice vector packs for the resonance renderer.
 */
export function buildResonanceSeries(records: MoodRecord[]): ResonanceSeries {
  const raws = buildRawSlices(records);
  markGapsAndEruptions(raws);

  const downsampled = raws.length > DOWNSAMPLE_THRESHOLD;
  const groups: RawSlice[][] = downsampled ? downsample(raws) : raws.map((r) => [r]);

  const slices: ResonanceSlice[] = groups.map((seeds, index) => {
    const last = seeds[seeds.length - 1];
    const t = last.t;
    const numbCount = seeds.filter((s) => s.numb).length;
    const isGap = numbCount / seeds.length >= 0.5;
    const eruptionFlag = seeds.some((s) => s.eruption) && !isGap;

    let coherence: number;
    let emotionsRaw: EmoStrength[];
    let intensity: number;

    if (seeds.length === 1) {
      coherence = seeds[0].coherence;
      emotionsRaw = seeds[0].emotions;
      intensity = seeds[0].intensity;
    } else {
      coherence =
        seeds.reduce((sum, s) => sum + s.coherence, 0) / seeds.length;
      const byTag = new Map<EmotionTag, EmoStrength>();
      for (const s of seeds) {
        for (const e of s.emotions) {
          const prev = byTag.get(e.tag);
          if (!prev || e.raw > prev.raw) byTag.set(e.tag, e);
        }
      }
      emotionsRaw = [...byTag.values()].sort((a, b) => b.raw - a.raw);
      if (emotionsRaw.length > MAX_SUB_WAVES) emotionsRaw = emotionsRaw.slice(0, MAX_SUB_WAVES);
      intensity = Math.max(...seeds.map((s) => s.intensity));
    }

    return assembleSlice(
      seeds,
      index,
      t,
      round2(coherence),
      emotionsRaw,
      strongestPerturbation(seeds),
      isGap,
      eruptionFlag,
      intensity,
      excerptOf(seeds)
    );
  });

  markTrends(slices);

  const from = slices.length > 0 ? slices[0].t : Date.now();
  const to = slices.length > 0 ? slices[slices.length - 1].t : from;

  const meta: ResonanceSeriesMeta = {
    recordCount: raws.length,
    sliceCount: slices.length,
    downsampled,
    from,
    to,
  };

  return { slices, meta };
}
