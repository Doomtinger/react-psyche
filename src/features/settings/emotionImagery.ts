import type { EmotionTag } from "@/domain/entities/MoodRecord";

/**
 * 情绪意象表：每种状态对应一幅具像化的动态图景。
 *
 * 文案来自产品意象规范（状态名 / 视觉 / 配色 / 动效 / 心理解读）。
 * `ranges` 保留规范里的三个参考数值区间，仅作展示，不参与任何计算或推导。
 * 这里只做感受的视觉表达，不产生任何心理测量或诊断结论。
 */

export type ImageryId =
  | "calm-lake"
  | "gentle-bloom"
  | "radiant-bloom"
  | "sinking-mist"
  | "soft-rain"
  | "restless-particles"
  | "cross-currents"
  | "ember-cloud"
  | "inward-fog"
  | "numb-haze"
  | "release";

export interface ImagerySpec {
  id: ImageryId;
  name: string;
  /** 规范中的三个参考数值区间（无表头，原样保留）。 */
  ranges: [string, string, string];
  visual: string;
  /** 场景取色，顺序与规范中的配色描述一致。 */
  palette: string[];
  bg: string;
  motion: string;
  meaning: string;
}

export const IMAGERY: Record<ImageryId, ImagerySpec> = {
  "calm-lake": {
    id: "calm-lake",
    name: "平静安稳",
    ranges: ["2–4", "0–1", "1–3"],
    visual:
      "宽阔平缓湖面，水面只有极淡极慢的一圈圈同心圆涟漪，水面干净，少量漂浮的柔光小圆光斑",
    palette: ["#a8d8e8", "#f5f3e8", "#b9cdd0"],
    bg: "#14202b",
    motion: "涟漪缓慢向外扩散，速度均匀，无晃动；光斑缓慢匀速漂浮，不聚集不散开",
    meaning: "此刻内心平稳，没有太多波澜，处在松弛、接纳的状态",
  },
  "gentle-bloom": {
    id: "gentle-bloom",
    name: "愉悦轻松",
    ranges: ["4–6", "0–2", "4–6"],
    visual:
      "半开的柔和小花，花瓣是朦胧虚化的，四周飘出少量细碎星光光点，光点向上缓缓飘升",
    palette: ["#f7c9cf", "#f6e6bc", "#c9e8d2"],
    bg: "#231f27",
    motion: "花瓣缓慢舒展，光点匀速上浮，偶尔轻轻闪烁，不会爆发",
    meaning: "心里是轻快舒展的，有淡淡的满足与开心",
  },
  "radiant-bloom": {
    id: "radiant-bloom",
    name: "狂喜惊喜",
    ranges: ["7–10", "0–2", "8–10"],
    visual:
      "一簇缓慢绽放的柔光花簇，大量星光粒子从中心向外轻柔散开，粒子是朦胧光斑，无尖锐闪光",
    palette: ["#f5a86a", "#f7dd8f", "#f6b6b8"],
    bg: "#2a1e1c",
    motion:
      "绽放有节奏，粒子向外扩散后慢慢变淡消散，扩散速度更快，禁止频闪",
    meaning: "强烈的喜悦、惊喜，情绪向外舒展，充满活力",
  },
  "sinking-mist": {
    id: "sinking-mist",
    name: "悲伤低落",
    ranges: ["3–7", "0–3", "1–3"],
    visual:
      "下沉的薄雾，零星缓慢飘落的虚化落叶，画面整体往下沉，薄雾有拖尾，不容易消散",
    palette: ["#8c9cb8", "#a99bbd", "#6f829e"],
    bg: "#171c28",
    motion: "落叶缓慢下坠，薄雾缓缓下沉，流动滞缓，消散很慢，有厚重拖尾",
    meaning: "情绪沉下来了，有点怅然、低落，这份感受会停留一阵子",
  },
  "soft-rain": {
    id: "soft-rain",
    name: "委屈难过",
    ranges: ["4–7", "2–4", "3–5"],
    visual:
      "低空细雨，雨丝细密柔和，落在朦胧水面上，泛起微弱水纹，雨持续绵绵不断",
    palette: ["#8fa6bf", "#aaa2bd", "#c0c6d4"],
    bg: "#181d28",
    motion: "雨丝匀速下落，水纹一圈圈慢慢淡去，不会暴雨式密集冲击",
    meaning: "心里有委屈，闷闷的，情绪一直在慢慢流淌",
  },
  "restless-particles": {
    id: "restless-particles",
    name: "焦虑烦躁",
    ranges: ["4–8", "4–7", "6–9"],
    visual:
      "散乱乱飞的细碎微光粒子，粒子在小范围空间来回游走、打转，局部形成小小的漩涡",
    palette: ["#b98a68", "#a67a70", "#c2ab68"],
    bg: "#231f1c",
    motion:
      "粒子运动无固定方向，来回回旋，速度忽快忽慢，整体在一个区域内反复徘徊",
    meaning: "思绪很乱，反复在同一个念头里打转，心里慌、静不下来",
  },
  "cross-currents": {
    id: "cross-currents",
    name: "纠结内耗",
    ranges: ["5–9", "7–10", "4–7"],
    visual:
      "两股流向相反的溪流，水流互相缠绕、推挤，一部分融合、一部分互相背离，形成松散漩涡",
    palette: ["#8fb6d9", "#e2adbd", "#c8c4d6"],
    bg: "#1b1e2a",
    motion:
      "两股水流一会靠近、一会分开，前进阻力大，流动卡顿，漩涡缓慢旋转",
    meaning: "两种感受在拉扯，理智和情绪不一样，一直在消耗自己",
  },
  "ember-cloud": {
    id: "ember-cloud",
    name: "愤怒恼火",
    ranges: ["6–10", "3–6", "7–10"],
    visual:
      "一团缓慢涌动的厚重暖红色云雾，云雾内部翻滚，向外缓慢释放细碎光斑，没有尖刺",
    palette: ["#b75f4e", "#9c4b45", "#d08a63"],
    bg: "#271a1a",
    motion: "云雾内部缓慢翻滚，短时间涌动幅度变大，之后慢慢散开变淡",
    meaning: "心里有火气，情绪在涌动，需要一点时间慢慢平复",
  },
  "inward-fog": {
    id: "inward-fog",
    name: "压抑封闭",
    ranges: ["4–8", "5–7", "2–4"],
    visual:
      "向内收拢、不断浓缩的一团浓雾，雾气向中心挤压，向外扩散的力量很弱",
    palette: ["#4c5b70", "#3f4654", "#65728a"],
    bg: "#12161f",
    motion: "雾气持续向内收缩，几乎没有向外流动，运动缓慢凝滞",
    meaning: "感受被堵住了，很多情绪压在心里，很难释放",
  },
  "numb-haze": {
    id: "numb-haze",
    name: "麻木空洞",
    ranges: ["1–3", "0–1", "0–2"],
    visual:
      "一片均匀、几乎静止的薄灰雾，没有粒子、没有涟漪、没有流动，几乎看不出变化",
    palette: ["#6a7078", "#7c828a", "#5b626b"],
    bg: "#171a1e",
    motion: "几乎无动态，极其微弱的缓慢淡化，几乎静止",
    meaning: "感受变轻了，好像和情绪隔了一层，空空的，没有起伏",
  },
  release: {
    id: "release",
    name: "释然和解",
    ranges: ["3–6", "1–3", "2–4"],
    visual:
      "原本缠绕的小漩涡、雨雾慢慢散开，变回平缓湖面，光斑重新慢慢浮现",
    palette: ["#6b7f96", "#a8d8cf", "#f2efe2"],
    bg: "#171f27",
    motion: "缠绕的结构逐步松解开，流动重新变得顺滑，色彩渐变柔和",
    meaning: "卡住自己的感受慢慢松开来，开始接纳、放下了",
  },
};

export interface TagImagery {
  tag: EmotionTag;
  primary: ImageryId;
  /** 同一标签下可切换查看的相近意象。 */
  related: ImageryId[];
}

/** 8 个内置情绪标签（不含「其他」）与意象的对应关系。 */
export const TAG_IMAGERY: TagImagery[] = [
  { tag: "calm", primary: "calm-lake", related: ["release"] },
  {
    tag: "happy",
    primary: "gentle-bloom",
    related: ["radiant-bloom", "release"],
  },
  { tag: "excited", primary: "radiant-bloom", related: ["gentle-bloom"] },
  {
    tag: "sad",
    primary: "sinking-mist",
    related: ["soft-rain", "numb-haze"],
  },
  {
    tag: "anxious",
    primary: "restless-particles",
    related: ["cross-currents"],
  },
  { tag: "angry", primary: "ember-cloud", related: ["inward-fog"] },
  { tag: "tired", primary: "numb-haze", related: ["inward-fog", "sinking-mist"] },
  {
    tag: "confused",
    primary: "cross-currents",
    related: ["restless-particles", "inward-fog"],
  },
];

/** The palette descriptions from the spec, shown next to the color swatches. */
export const PALETTE_LABELS: Record<ImageryId, string> = {
  "calm-lake": "浅湖蓝、奶白、淡青灰，低饱和",
  "gentle-bloom": "浅桃粉、暖米黄、淡薄荷绿",
  "radiant-bloom": "暖橙、浅金、蜜桃粉",
  "sinking-mist": "雾灰蓝、灰紫、低饱和烟蓝",
  "soft-rain": "灰蓝、淡紫灰",
  "restless-particles": "暗橘灰、砖灰、浊黄",
  "cross-currents": "一组淡蓝、一组浅粉，交融但不同化",
  "ember-cloud": "赭石红、暗砖红，明度中等，不刺眼",
  "inward-fog": "深灰蓝、炭灰，低明度",
  "numb-haze": "极低饱和灰，贴近背景色",
  release: "从暗沉灰蓝／暗红，逐步过渡到浅青、奶白",
};

