import type { EmotionTag } from "@/domain/entities/MoodRecord";

/**
 * Local lexicons for the resonance analysis engine.
 *
 * The app runs fully offline, so the four analysis dimensions (explicit
 * emotion vector, coherence/conflict, perturbation, temporal continuity) are
 * derived with lightweight keyword matching over the user's own text.
 * Words are matched with plain `includes` — no stemming, no scoring model.
 *
 * These lists only drive *visual* parameters (wave phase, amplitude, color).
 * They never produce diagnostic labels.
 */

/** 想法接纳感受 → coherence towards +1. */
export const ACCEPTANCE_WORDS = [
  "允许",
  "接纳",
  "接受",
  "没关系",
  "沒关系",
  "没事的",
  "正常",
  "可以理解",
  "理解自己",
  "慢慢来",
  "原谅自己",
  "和解",
  "值得被",
  "承认",
  "坦然",
  "允许自己",
  "不怪自己",
  "这很正常",
] as const;

/** 想法压抑/否定感受 → coherence towards -1. */
export const SUPPRESSION_WORDS = [
  "不该",
  "不应该",
  "不值得",
  "不配",
  "忍住",
  "忍一忍",
  "压下去",
  "别想了",
  "不要想",
  "不许",
  "克制",
  "控制住",
  "假装没事",
  "装作没事",
  "矫情",
  "太脆弱",
  "太敏感",
  "丢人",
  "丢脸",
  "可耻",
  "至于吗",
  "有什么好",
  "不该生气",
  "不该难过",
  "不该哭",
] as const;

/** 情感隔离 / 麻木 → isolation gap slices. */
export const NUMBNESS_WORDS = [
  "麻木",
  "空白",
  "没感觉",
  "感觉不到",
  "感受不到",
  "说不出",
  "说不上来",
  "麻了",
  "脑子空",
  "一片空",
  "恍惚",
  "僵住",
  "没有情绪",
  "毫无情绪",
  "无感",
  "像隔着",
  "不真实",
] as const;

/** Strong external events → perturbation shock points. */
export const STRONG_EVENT_WORDS = [
  "分手",
  "失恋",
  "失去",
  "离开",
  "去世",
  "离世",
  "争吵",
  "吵架",
  "冲突",
  "崩溃",
  "大哭",
  "意外",
  "事故",
  "手术",
  "确诊",
  "生病",
  "住院",
  "裁员",
  "被辞",
  "离职",
  "入职",
  "面试",
  "晋升",
  "升职",
  "录取",
  "搬家",
  "毕业",
  "表白",
  "和好",
  "复合",
  "告白",
] as const;

/** Note keywords per emotion tag: boost the tag when mentioned in text. */
export const EMOTION_KEYWORDS: Record<EmotionTag, readonly string[]> = {
  calm: ["平静", "安稳", "放松", "舒缓", "踏实", "安心", "宁静", "松弛"],
  happy: ["开心", "高兴", "快乐", "愉快", "满足", "雀跃", "欣慰", "感动", "幸福", "惊喜"],
  sad: ["难过", "伤心", "低落", "沉重", "想哭", "委屈", "失落", "伤感", "悲伤", "心痛"],
  anxious: ["焦虑", "紧张", "不安", "担心", "害怕", "恐惧", "慌", "心神不定", "担忧"],
  angry: ["生气", "愤怒", "恼火", "烦躁", "火大", "气不过", "愤愤", "恼人"],
  tired: ["疲惫", "累", "乏力", "困倦", "倦", "耗尽", "提不起", "无力"],
  excited: ["兴奋", "期待", "激动", "迫不及待", "跃跃欲试", "振奋"],
  confused: ["困惑", "迷茫", "不确定", "纠结", "矛盾", "不知道", "混乱", "摇摆"],
  other: [],
};

/** Valence groups used to detect 对抗叠加 (mixed opposite emotions). */
export const POSITIVE_TAGS: readonly EmotionTag[] = ["calm", "happy", "excited"];
export const NEGATIVE_TAGS: readonly EmotionTag[] = [
  "sad",
  "anxious",
  "angry",
  "tired",
];
export const AMBIGUOUS_TAGS: readonly EmotionTag[] = ["confused", "other"];
