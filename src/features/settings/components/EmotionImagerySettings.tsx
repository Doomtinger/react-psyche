"use client";

import { useState } from "react";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { EMOTION_OPTIONS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import { Modal } from "@/shared/components/Modal";
import { useReducedMotion } from "@/shared/utils/useReducedMotion";
import {
  IMAGERY,
  IMAGERY_IDS,
  PALETTE_LABELS,
  TAG_IMAGERY,
  type ImageryId,
} from "../emotionImagery";
import { EmotionImageryScene, ImageryGlyph } from "./EmotionImageryScene";

interface EmotionImagerySettingsProps {
  /** Persisted "reduce motion" preference from the settings page. */
  reducedMotion: boolean;
}

/**
 * Settings block: one pictogram button per built-in emotion tag. Clicking it
 * opens the corresponding concrete imagery in a dialog, with the related
 * states of that tag available as switches.
 */
export function EmotionImagerySettings({
  reducedMotion,
}: EmotionImagerySettingsProps) {
  const osReduced = useReducedMotion();
  const still = reducedMotion || osReduced;
  const [activeTag, setActiveTag] = useState<EmotionTag | null>(null);
  const [activeImagery, setActiveImagery] = useState<ImageryId | null>(null);

  const tagImagery = TAG_IMAGERY.find((t) => t.tag === activeTag);
  const spec = activeImagery ? IMAGERY[activeImagery] : null;
  const tagLabel =
    EMOTION_OPTIONS.find((o) => o.value === activeTag)?.label ?? "";
  const choices = tagImagery?.chooseAny
    ? IMAGERY_IDS
    : tagImagery
      ? [tagImagery.primary, ...tagImagery.related]
      : [];

  function close() {
    setActiveTag(null);
    setActiveImagery(null);
  }

  return (
    <>
      <section className="settings-card imagery-settings">
        <h2 className="settings-card-title">情绪意象</h2>
        <p className="settings-desc">
          每个情绪标签对应一幅具像化的图景。点击标签旁的小图案，看看这份感受长什么样。图景只作感受表达，不是测评结论。
        </p>
        <div className="imagery-tag-list" role="list" aria-label="情绪标签意象">
          {TAG_IMAGERY.map(({ tag, primary, chooseAny }) => {
            const label =
              EMOTION_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
            const imagery = IMAGERY[primary];
            return (
              <div className="imagery-tag-row" role="listitem" key={tag}>
                <span
                  className="emotion-dot"
                  style={{ backgroundColor: emotionColor(tag) }}
                  aria-hidden="true"
                />
                <span className="imagery-tag-name">{label}</span>
                <span className="imagery-tag-state">
                  {chooseAny ? "未预设 · 可任选" : imagery.name}
                </span>
                <button
                  type="button"
                  className="imagery-glyph-btn"
                  aria-label={
                    chooseAny
                      ? `查看「${label}」的意象：任选一种图景`
                      : `查看「${label}」的意象：${imagery.name}`
                  }
                  title={
                    chooseAny
                      ? "没有预设意象，打开后可挑选任意一种图景"
                      : `查看「${imagery.name}」的具像化图形`
                  }
                  onClick={() => {
                    setActiveTag(tag);
                    setActiveImagery(primary);
                  }}
                >
                  {chooseAny ? (
                    <span className="imagery-glyph-any" aria-hidden="true">?</span>
                  ) : (
                    <ImageryGlyph id={primary} size={22} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <Modal
        open={activeTag !== null && spec !== null}
        onClose={close}
        title={`${tagLabel} · ${spec?.name ?? ""}`}
      >
        {spec ? (
          <div className="imagery-dialog">
            <EmotionImageryScene id={spec.id} reducedMotion={still} />

            {tagImagery?.chooseAny ? (
              <p className="imagery-note">
                「其他 / 难以归类」没有预设意象，可以从下面 {IMAGERY_IDS.length} 种图景里挑一种来看。
              </p>
            ) : null}

            {choices.length > 1 ? (
              <div
                className="imagery-switch"
                role="group"
                aria-label={tagImagery?.chooseAny ? "任选意象" : "相关意象"}
              >
                {choices.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      id === spec.id ? "btn btn-primary sm" : "btn btn-ghost sm"
                    }
                    aria-pressed={id === spec.id}
                    onClick={() => setActiveImagery(id)}
                  >
                    {IMAGERY[id].name}
                  </button>
                ))}
              </div>
            ) : null}

            <dl className="imagery-facts">
              <div>
                <dt>画面</dt>
                <dd>{spec.visual}</dd>
              </div>
              <div>
                <dt>配色</dt>
                <dd className="imagery-palette">
                  {spec.palette.map((color, i) => (
                    <span
                      key={i}
                      className="imagery-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                      aria-hidden="true"
                    />
                  ))}
                  <span>{PALETTE_LABELS[spec.id]}</span>
                </dd>
              </div>
              <div>
                <dt>动效</dt>
                <dd>{spec.motion}</dd>
              </div>
              <div>
                <dt>感受</dt>
                <dd>{spec.meaning}</dd>
              </div>
              <div>
                <dt>参考值</dt>
                <dd>{spec.ranges.join(" · ")}</dd>
              </div>
            </dl>
            <p className="imagery-note">
              仅作感受可视化，非心理测量或诊断结论。
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
