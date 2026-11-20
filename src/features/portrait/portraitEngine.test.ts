import { describe, it, expect } from "vitest";
import { computePortrait, stretch } from "./portraitEngine";
import { DIMENSIONS, PORTRAIT_IMAGES } from "./portraitData";

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
