import { describe, it, expect } from "vitest";
import { computePortrait, stretch } from "./portraitEngine";
import {
  buildPortraitDeck,
  DIMENSION_IDS,
  DIMENSIONS,
  PICK_POOL_SIZE,
  PORTRAIT_IMAGES,
} from "./portraitData";

describe("stretch", () => {
  it("把六个维度拉伸到 20—90 区间", () => {
    const raw = { explore: 0.9, empathy: 0.1, order: 0.5, action: 0.3, imagination: 0.7, social: 0.2 };
    const scores = stretch(raw);
    for (const d of DIMENSIONS) {
      expect(scores[d.id]).toBeGreaterThanOrEqual(20);
      expect(scores[d.id]).toBeLessThanOrEqual(90);
    }
    expect(scores.explore).toBe(90);
    expect(scores.empathy).toBe(20);
  });

  it("全部维度相等时取区间中点，避免除零", () => {
    const raw = { explore: 0.5, empathy: 0.5, order: 0.5, action: 0.5, imagination: 0.5, social: 0.5 };
    const scores = stretch(raw);
    for (const d of DIMENSIONS) {
      expect(scores[d.id]).toBe(55);
    }
  });
});

describe("computePortrait", () => {
  it("返回六个分数、按分数排序的维度与两条洞察", () => {
    const ids = PORTRAIT_IMAGES.slice(0, 6).map((img) => img.id);
    const result = computePortrait(ids);
    expect(Object.keys(result.scores)).toHaveLength(6);
    expect(result.rankedDims).toHaveLength(6);
    expect(result.insights).toHaveLength(2);
    // rankedDims 按分数降序
    const values = result.rankedDims.map((id) => result.scores[id]);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });

  it("标题由最高维与次高维组成", () => {
    const ids = PORTRAIT_IMAGES.slice(0, 6).map((img) => img.id);
    const result = computePortrait(ids);
    const ranked = result.rankedDims;
    expect(ranked.indexOf(ranked[0])).toBeLessThan(ranked.indexOf(ranked[1]));
    expect(typeof result.title).toBe("string");
    expect(result.title.length).toBeGreaterThan(0);
  });

  it("对未知 id 有容错（只统计命中的图片）", () => {
    const result = computePortrait(["img_path", "img_nonexistent"]);
    expect(result).toBeTruthy();
    expect(result.rankedDims[0]).toBe("explore");
  });
});

describe("buildPortraitDeck", () => {
  it("同一 seed 复现同一批图卡", () => {
    expect(buildPortraitDeck(20261121)).toEqual(buildPortraitDeck(20261121));
  });

  it("不同 seed 会抽到不同的图形，而不只是换位置", () => {
    const a = buildPortraitDeck(1);
    const b = buildPortraitDeck(2);
    const idsA = a.map((c) => c.image.id).sort().join(",");
    const idsB = b.map((c) => c.image.id).sort().join(",");
    expect(idsA).not.toBe(idsB);
  });

  it("每次按维度均衡抽取，且图库比展示的牌组更大", () => {
    expect(PORTRAIT_IMAGES.length).toBeGreaterThan(PICK_POOL_SIZE);
    for (const seed of [1, 42, 2026]) {
      const deck = buildPortraitDeck(seed);
      expect(deck).toHaveLength(PICK_POOL_SIZE);
      expect(new Set(deck.map((c) => c.image.id)).size).toBe(PICK_POOL_SIZE);
      for (const dim of DIMENSION_IDS) {
        const count = deck.filter((c) => {
          const vector = c.image.vector;
          const top = DIMENSION_IDS.reduce(
            (best, id) => (vector[id] > vector[best] ? id : best),
            DIMENSION_IDS[0]
          );
          return top === dim;
        }).length;
        expect(count).toBe(3);
      }
    }
  });

  it("只改展示，不改 id / 标签 / 六维向量与画像结果", () => {
    const deck = buildPortraitDeck(987654);
    expect(deck).toHaveLength(PICK_POOL_SIZE);
    for (const card of deck) {
      const original = PORTRAIT_IMAGES.find((i) => i.id === card.image.id)!;
      expect(original).toBeTruthy();
      expect(card.image.label).toBe(original.label);
      expect(card.image.vector).toEqual(original.vector);
      expect(card.image.hue).toEqual(original.hue);
    }
    const ids = PORTRAIT_IMAGES.slice(0, 6).map((i) => i.id);
    expect(computePortrait([...ids].reverse()).scores).toEqual(
      computePortrait(ids).scores
    );
  });

  it("变体限制在轻微范围内", () => {
    for (const { variant } of buildPortraitDeck(42)) {
      expect(Math.abs(variant.dx)).toBeLessThanOrEqual(5);
      expect(Math.abs(variant.dy)).toBeLessThanOrEqual(4);
      expect(Math.abs(variant.rotate)).toBeLessThanOrEqual(4);
      expect(variant.scale).toBeGreaterThanOrEqual(0.94);
      expect(variant.scale).toBeLessThanOrEqual(1.06);
      expect(Math.abs(variant.hueShift)).toBeLessThanOrEqual(18);
      expect(variant.gradient).toBeGreaterThanOrEqual(0);
      expect(variant.gradient).toBeLessThanOrEqual(3);
    }
  });
});
