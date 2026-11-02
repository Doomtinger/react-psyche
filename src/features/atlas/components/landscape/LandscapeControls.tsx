"use client";

import { EMOTION_OPTIONS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import { cn } from "@/shared/utils/cn";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import type { LandscapeMode } from "./types";

type RangePreset = "7d" | "30d" | "all";

interface LandscapeControlsProps {
  mode: LandscapeMode;
  onModeChange: (mode: LandscapeMode) => void;
  rangePreset: RangePreset;
  onRangeChange: (preset: RangePreset) => void;
  playhead: number;
  onPlayheadChange: (value: number) => void;
  highlightEmotion: EmotionTag | null;
  onHighlightChange: (emotion: EmotionTag | null) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (value: boolean) => void;
  onResetView: () => void;
}

const MODES: { key: LandscapeMode; label: string; hint: string }[] = [
  {
    key: "resonance",
    label: "时序共振流",
    hint: "时序心理共振流图：多股内心子波随时间的共振、拉扯与修复",
  },
  { key: "fluid", label: "流体心理场", hint: "情绪强度与波动化为流动曲面" },
  { key: "terrain", label: "心理地形", hint: "强度起伏形成空间地形" },
  { key: "starmap", label: "意识星图", hint: "记录为节点，重复模式成簇" },
];

const RANGES: { key: RangePreset; label: string }[] = [
  { key: "7d", label: "近一周" },
  { key: "30d", label: "近一月" },
  { key: "all", label: "全部" },
];

export function LandscapeControls({
  mode,
  onModeChange,
  rangePreset,
  onRangeChange,
  playhead,
  onPlayheadChange,
  highlightEmotion,
  onHighlightChange,
  reducedMotion,
  onReducedMotionChange,
  onResetView,
}: LandscapeControlsProps) {
  return (
    <div className="landscape-controls">
      <div className="landscape-control-block">
        <span className="landscape-control-label">可视化</span>
        <div className="preset-group" role="group" aria-label="可视化模式">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              title={m.hint}
              className={mode === m.key ? "btn btn-primary sm" : "btn btn-ghost sm"}
              aria-pressed={mode === m.key}
              onClick={() => onModeChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="landscape-control-block">
        <span className="landscape-control-label">范围</span>
        <div className="preset-group" role="group" aria-label="时间范围">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={
                rangePreset === r.key ? "btn btn-primary sm" : "btn btn-ghost sm"
              }
              aria-pressed={rangePreset === r.key}
              onClick={() => onRangeChange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="landscape-control-block landscape-control-grow">
        <span className="landscape-control-label">时间轴</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(playhead * 100)}
          className="landscape-slider"
          onChange={(e) => onPlayheadChange(Number(e.target.value) / 100)}
          aria-label="拖动以演变场景"
        />
      </div>

      <div className="landscape-control-block">
        <span className="landscape-control-label">情绪</span>
        <div className="filter-group" role="group" aria-label="情绪高亮">
          {EMOTION_OPTIONS.map((opt) => {
            const active = highlightEmotion === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={cn("filter-chip", active && "active")}
                aria-pressed={active}
                onClick={() =>
                  onHighlightChange(active ? null : opt.value)
                }
                style={
                  active
                    ? {
                        borderColor: emotionColor(opt.value),
                        color: emotionColor(opt.value),
                      }
                    : undefined
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="landscape-control-block landscape-control-actions">
        <label className="settings-toggle" title="降低或关闭动态效果">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => onReducedMotionChange(e.target.checked)}
          />
          静态模式
        </label>
        <button type="button" className="btn btn-secondary sm" onClick={onResetView}>
          复位视角
        </button>
      </div>
    </div>
  );
}
