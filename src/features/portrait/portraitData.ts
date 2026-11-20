/**
 * 人物画像 MVP：六维定义、内置图库（向量标注）与文案模板。
 *
 * 六个维度均为正向维度（越高越强），覆盖认知 / 情感 / 行为 / 社会四个面。
 * 每张图人工标注一个六维权重向量（0—1），标注原则是「这张图会让哪类人停留」。
 * 分数区间 20—90，避免极端值让画像显得像测评而非描述。
 */

export type DimensionId =
  | "explore"
  | "empathy"
  | "order"
  | "action"
  | "imagination"
  | "social";

export interface PortraitDimension {
  id: DimensionId;
  name: string;
  /** 标题句式用的两字短词。 */
  short: string;
  /** 六维短描述：只写行为，不写分数评价。 */
  blurb: string;
  /** 该维为最高维时的洞察。 */
  insightHigh: string;
  /** 该维为最低维时的洞察。 */
  insightLow: string;
}

export const DIMENSIONS: PortraitDimension[] = [
  {
    id: "explore",
    name: "探索力",
    short: "探索",
    blurb: "面对没去过的地方、没试过的东西，你多半会先凑近看看。",
    insightHigh: "当环境陌生时，你更可能先走近看看，而不是等别人先动。",
    insightLow:
      "面对陌生环境，你倾向先站远一点看清全局，再决定要不要靠近——谨慎是你的默认设置。",
  },
  {
    id: "empathy",
    name: "共情力",
    short: "共情",
    blurb: "你通常先感受到房间里的气氛，再决定说什么。",
    insightHigh: "别人还没把话说完，你已经先接住了对方的情绪。",
    insightLow:
      "你更习惯就事论事，情绪的暗流通常要别人点破你才会留意——这不代表冷漠，只是你的注意力更多在事情本身。",
  },
  {
    id: "order",
    name: "秩序感",
    short: "秩序",
    blurb: "把事情安排清楚之后，你才能真正放松下来。",
    insightHigh: "计划被打乱时你会不舒服，不是刻板，是秩序让你安心。",
    insightLow: "你不太被计划绑住，随机应变反而让你感到自在。",
  },
  {
    id: "action",
    name: "行动力",
    short: "行动",
    blurb: "想做的事在你这里很少过夜，通常很快就动了手。",
    insightHigh: "从想法到动手，你几乎不给犹豫留时间。",
    insightLow:
      "你习惯把一件事在心里盘几轮再出手——慢不代表不动，是你在等最好的时机。",
  },
  {
    id: "imagination",
    name: "想象力",
    short: "想象",
    blurb: "你的脑子里常常同时开着好几个「如果是这样呢」。",
    insightHigh: "你很容易从一个细节滑进一整段想象，发呆是你创造力最强的时候。",
    insightLow: "你更信任看得见摸得着的东西，具体的世界已经足够你忙了。",
  },
  {
    id: "social",
    name: "社交能量",
    short: "社交",
    blurb: "和聊得来的人待在一起，你会明显更有精神。",
    insightHigh: "人越多你越有劲，别人的存在本身就是你的能量来源。",
    insightLow:
      "人多的场合，你倾向于先观察一轮再开口——这不代表你不合群，只是你的能量来自别处。",
  },
];

export const DIMENSION_IDS = DIMENSIONS.map((d) => d.id) as DimensionId[];

type Vector = Record<DimensionId, number>;

/** 标题句式：按最高维所在面选择，只换维度词，保证产出稳定。 */
const TITLE_TEMPLATES: Record<DimensionId, (top: string, second: string) => string> = {
  explore: (t, s) => `偏${t}的${s}型选手`,
  imagination: (t, s) => `偏${t}的${s}型选手`,
  empathy: (t, s) => `${t}驱动的${s}连接者`,
  social: (t, s) => `${t}驱动的${s}连接者`,
  order: (t, s) => `以${s}为底色的${t}派`,
  action: (t, s) => `以${s}为底色的${t}派`,
};

export function titleFor(topName: string, topId: DimensionId, secondName: string): string {
  return TITLE_TEMPLATES[topId](topName, secondName);
}

export type MotifId =
  | "mountains"
  | "horizon"
  | "stars"
  | "table"
  | "letters"
  | "window"
  | "facade"
  | "shelves"
  | "grid"
  | "stairs"
  | "flame"
  | "waves"
  | "kaleido"
  | "clouds"
  | "campfire"
  | "lights"
  | "bubbles";

export interface PortraitImage {
  id: string;
  /** 视觉母题，由 ImageTile 渲染成一张小图。 */
  motif: MotifId;
  /** 渐变两色（暗色主题下的画面基调）。 */
  hue: [string, string];
  label: string;
  vector: Vector;
}

export const PORTRAIT_IMAGES: PortraitImage[] = [
  // —— 探索力 ——
  {
    id: "img_path",
    motif: "mountains",
    hue: ["#3d6a58", "#16302a"],
    label: "荒野小径",
    vector: { explore: 0.85, empathy: 0.2, order: 0.3, action: 0.55, imagination: 0.45, social: 0.1 },
  },
  {
    id: "img_stars",
    motif: "stars",
    hue: ["#2b3a6b", "#101631"],
    label: "夜晚星空",
    vector: { explore: 0.6, empathy: 0.25, order: 0.1, action: 0.15, imagination: 0.8, social: 0.15 },
  },
  {
    id: "img_horizon",
    motif: "horizon",
    hue: ["#3f6e8f", "#132633"],
    label: "海崖远眺",
    vector: { explore: 0.8, empathy: 0.3, order: 0.25, action: 0.4, imagination: 0.55, social: 0.2 },
  },
  // —— 共情力 ——
  {
    id: "img_table",
    motif: "table",
    hue: ["#8f6a4a", "#2e2019"],
    label: "暖光餐桌",
    vector: { explore: 0.15, empathy: 0.85, order: 0.4, action: 0.25, imagination: 0.3, social: 0.7 },
  },
  {
    id: "img_letter",
    motif: "letters",
    hue: ["#7a6a8f", "#241e2e"],
    label: "手写信纸",
    vector: { explore: 0.25, empathy: 0.8, order: 0.35, action: 0.3, imagination: 0.45, social: 0.35 },
  },
  {
    id: "img_window",
    motif: "window",
    hue: ["#5c5470", "#1a1826"],
    label: "灯火窗景",
    vector: { explore: 0.3, empathy: 0.7, order: 0.45, action: 0.2, imagination: 0.4, social: 0.55 },
  },
  // —— 秩序感 ——
  {
    id: "img_facade",
    motif: "facade",
    hue: ["#4a5a78", "#181f2e"],
    label: "规整立面",
    vector: { explore: 0.2, empathy: 0.15, order: 0.9, action: 0.35, imagination: 0.2, social: 0.25 },
  },
  {
    id: "img_shelves",
    motif: "shelves",
    hue: ["#6b5a3f", "#241d12"],
    label: "整齐书架",
    vector: { explore: 0.45, empathy: 0.2, order: 0.85, action: 0.3, imagination: 0.5, social: 0.15 },
  },
  {
    id: "img_grid",
    motif: "grid",
    hue: ["#3f5566", "#141d26"],
    label: "几何网格",
    vector: { explore: 0.25, empathy: 0.1, order: 0.8, action: 0.45, imagination: 0.55, social: 0.1 },
  },
  // —— 行动力 ——
  {
    id: "img_stairs",
    motif: "stairs",
    hue: ["#7a5a3a", "#2a1e12"],
    label: "台阶向上",
    vector: { explore: 0.5, empathy: 0.15, order: 0.5, action: 0.85, imagination: 0.25, social: 0.2 },
  },
  {
    id: "img_flame",
    motif: "flame",
    hue: ["#9f5a35", "#2e1a10"],
    label: "跳动火苗",
    vector: { explore: 0.35, empathy: 0.4, order: 0.15, action: 0.8, imagination: 0.5, social: 0.45 },
  },
  {
    id: "img_summit",
    motif: "mountains",
    hue: ["#5a7a94", "#16222c"],
    label: "陡峭山峰",
    vector: { explore: 0.6, empathy: 0.1, order: 0.3, action: 0.8, imagination: 0.3, social: 0.15 },
  },
  // —— 想象力 ——
  {
    id: "img_waves",
    motif: "waves",
    hue: ["#4a7a8f", "#14262e"],
    label: "流动色块",
    vector: { explore: 0.5, empathy: 0.3, order: 0.1, action: 0.2, imagination: 0.9, social: 0.3 },
  },
  {
    id: "img_kaleido",
    motif: "kaleido",
    hue: ["#7a4a7f", "#221326"],
    label: "万花筒",
    vector: { explore: 0.45, empathy: 0.2, order: 0.25, action: 0.3, imagination: 0.85, social: 0.2 },
  },
  {
    id: "img_clouds",
    motif: "clouds",
    hue: ["#6a7a9f", "#1a2033"],
    label: "云的形状",
    vector: { explore: 0.35, empathy: 0.35, order: 0.15, action: 0.2, imagination: 0.8, social: 0.3 },
  },
  // —— 社交能量 ——
  {
    id: "img_campfire",
    motif: "campfire",
    hue: ["#8f5a3a", "#2a1a12"],
    label: "篝火围坐",
    vector: { explore: 0.3, empathy: 0.55, order: 0.25, action: 0.4, imagination: 0.35, social: 0.9 },
  },
  {
    id: "img_market",
    motif: "lights",
    hue: ["#8f7a3a", "#2a2412"],
    label: "市集灯火",
    vector: { explore: 0.45, empathy: 0.5, order: 0.3, action: 0.5, imagination: 0.4, social: 0.8 },
  },
  {
    id: "img_bubbles",
    motif: "bubbles",
    hue: ["#4a6a9f", "#14202e"],
    label: "对话气泡",
    vector: { explore: 0.2, empathy: 0.6, order: 0.3, action: 0.35, imagination: 0.35, social: 0.85 },
  },
];

export const PICK_COUNT = 6;
/** 结果页展示的图卡数量。 */
export const PICK_POOL_SIZE = PORTRAIT_IMAGES.length;
