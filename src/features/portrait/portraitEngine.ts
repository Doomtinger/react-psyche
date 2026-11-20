/**
 * 选图 → 画像 的映射引擎。
 *
 * d = 选中图片向量的六维平均；D = 拉伸到 20—90 的校准分。
 * 拉伸让「相对突出」的维度真正凸显：不做这一步，六个分数会挤在
 * 45—55 之间，雷达图接近正六边形，画像失去区分度。
 */

import {
  DIMENSIONS,
  PORTRAIT_IMAGES,
  titleFor,
  type DimensionId,
  type PortraitImage,
} from "./portraitData";

export interface PortraitScores {
  explore: number;
  empathy: number;
  order: number;
  action: number;
  imagination: number;
  social: number;
}

export interface PortraitResult {
  scores: PortraitScores;
  /** 按分数从高到低排序的维度 id。 */
  rankedDims: DimensionId[];
  title: string;
  insights: [string, string];
}

const SCALE_MIN = 20;
const SCALE_MAX = 90;

function meanVector(images: PortraitImage[]): Record<DimensionId, number> {
  const sum: Record<DimensionId, number> = {
    explore: 0,
    empathy: 0,
    order: 0,
    action: 0,
    imagination: 0,
    social: 0,
  };
  for (const img of images) {
    for (const dim of DIMENSIONS) {
      sum[dim.id] += img.vector[dim.id];
    }
  }
  const n = images.length || 1;
  return {
    explore: sum.explore / n,
    empathy: sum.empathy / n,
    order: sum.order / n,
    action: sum.action / n,
    imagination: sum.imagination / n,
    social: sum.social / n,
  };
}

/**
 * 把六维平均分拉伸到 [SCALE_MIN, SCALE_MAX]。
 * 所有维度相等（分母为 0）时统一取区间中点，画出一个干净的正六边形。
 */
export function stretch(raw: Record<DimensionId, number>): PortraitScores {
  const values = DIMENSIONS.map((d) => raw[d.id]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const out = {} as PortraitScores;
  for (const d of DIMENSIONS) {
    if (span === 0) {
      out[d.id] = Math.round((SCALE_MIN + SCALE_MAX) / 2);
    } else {
      const normalized = (raw[d.id] - min) / span;
      out[d.id] = Math.round(SCALE_MIN + (SCALE_MAX - SCALE_MIN) * normalized);
    }
  }
  return out;
}

export function computePortrait(imageIds: string[]): PortraitResult {
  const byId = new Map(PORTRAIT_IMAGES.map((img) => [img.id, img]));
  const selected = imageIds
    .map((id) => byId.get(id))
    .filter((img): img is PortraitImage => img !== undefined);

  const scores = stretch(meanVector(selected));

  const rankedDims = [...DIMENSIONS]
    .sort((a, b) => scores[b.id] - scores[a.id])
    .map((d) => d.id);

  const top = DIMENSIONS.find((d) => d.id === rankedDims[0])!;
  const second = DIMENSIONS.find((d) => d.id === rankedDims[1])!;
  const lowest = DIMENSIONS.find((d) => d.id === rankedDims[5])!;

  const title = titleFor(top.short, top.id, second.short);

  // 洞察各取一条：最高维的「高维洞察」+ 最低维的「低维洞察」。
  const insights: [string, string] = [top.insightHigh, lowest.insightLow];

  return { scores, rankedDims, title, insights };
}
