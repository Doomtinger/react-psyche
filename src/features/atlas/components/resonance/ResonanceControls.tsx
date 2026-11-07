"use client";

import { EMOTION_OPTIONS } from "@/features/records/types";
import { emotionColor } from "@/shared/constants/emotions";
import { cn } from "@/shared/utils/cn";
import type { EmotionTag } from "@/domain/entities/MoodRecord";

interface ResonanceControlsProps {
  simpleView: boolean;
  onSimpleViewChange: (value: boolean) => void;
  playing: boolean;
  onTogglePlay: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  granularity: "day" | "week";
  onGranularityChange: (value: "day" | "week") => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  highlightEmotion: EmotionTag | null;
  onHighlightChange: (emotion: EmotionTag | null) => void;
  reducedMotion: boolean;
  onReducedMotionChange: (value: boolean) => void;
  watermark: boolean;
  onWatermarkChange: (value: boolean) => void;
  onExport: () => void;
  exporting: boolean;
  /** Switch back to the 3D visualization modes (out of the resonance view). */
  onExitToVisualization: () => void;
}

const SPEEDS = [0.5, 1, 2] as const;

/**
 * Control bar for the resonance flow. Independent from the 3D landscape's
 * controls: playback (play/pause/progress/speed), day/week granularity,
 * zoom, complex/simple view switch, emotion highlighting, export.
 */
export function ResonanceControls({
  simpleView,
  onSimpleViewChange,
  playing,
  onTogglePlay,
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
  granularity,
  onGranularityChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  highlightEmotion,
  onHighlightChange,
  reducedMotion,
  onReducedMotionChange,
  watermark,
  onWatermarkChange,
  onExport,
  exporting,
  onExitToVisualization,
}: ResonanceControlsProps) {
  return (
    <div className="landscape-controls">
      <div className="landscape-control-block">
        <span className="landscape-control-label">视图</span>
        <div className="preset-group" role="group" aria-label="视图切换">
          <button
            type="button"
            className={!simpleView ? "btn btn-primary sm" : "btn btn-ghost sm"}
            aria-pressed={!simpleView}
            title="多条彩色细线＝同时存在的情绪，纵轴＝相干度（内心是否一致）"
            onClick={() => onSimpleViewChange(false)}
          >
            共振流图
          </button>
          <button
            type="button"
            className={simpleView ? "btn btn-primary sm" : "btn btn-ghost sm"}
            aria-pressed={simpleView}
            title="只看一条线：纵轴＝情绪强度 0–10，更容易读"
            onClick={() => onSimpleViewChange(true)}
          >
            强度折线
          </button>
        </div>
      </div>

      {!simpleView ? (
        <div className="landscape-control-block landscape-control-grow">
          <span className="landscape-control-label">时序回放</span>
          <div className="resonance-playback">
            <button
              type="button"
              className="btn btn-secondary sm resonance-play-btn"
              onClick={onTogglePlay}
              aria-label={playing ? "暂停回放" : "播放时序生长动画"}
            >
              {playing ? "⏸ 暂停" : "▶ 播放"}
            </button>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              className="landscape-slider"
              aria-label="回放进度"
              onChange={(e) => onProgressChange(Number(e.target.value) / 1000)}
            />
            <div className="preset-group" role="group" aria-label="播放速度">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={speed === s ? "btn btn-primary sm" : "btn btn-ghost sm"}
                  aria-pressed={speed === s}
                  onClick={() => onSpeedChange(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="landscape-control-block">
        <span className="landscape-control-label" title="只改变日期刻度的疏密，不会合并或筛选记录">时间刻度</span>
        <div className="preset-group" role="group" aria-label="时间刻度疏密">
          <button
            type="button"
            className={granularity === "day" ? "btn btn-primary sm" : "btn btn-ghost sm"}
            aria-pressed={granularity === "day"}
            title="每天标一个日期"
            onClick={() => onGranularityChange("day")}
          >
            按天
          </button>
          <button
            type="button"
            className={granularity === "week" ? "btn btn-primary sm" : "btn btn-ghost sm"}
            aria-pressed={granularity === "week"}
            title="每周只标一个日期，适合记录很多时减少拥挤；记录本身不变"
            onClick={() => onGranularityChange("week")}
          >
            按周
          </button>
        </div>
      </div>

      <div className="landscape-control-block">
        <span className="landscape-control-label">缩放</span>
        <div className="preset-group" role="group" aria-label="时间轴缩放">
          <button
            type="button"
            className="btn btn-ghost sm"
            title="放大时间轴"
            aria-label="放大时间轴"
            onClick={onZoomIn}
          >
            ＋
          </button>
          <button
            type="button"
            className="btn btn-ghost sm"
            title="缩小时间轴"
            aria-label="缩小时间轴"
            onClick={onZoomOut}
          >
            －
          </button>
          <button
            type="button"
            className="btn btn-secondary sm"
            title="回到完整时间概览"
            onClick={onResetView}
          >
            复位视图
          </button>
        </div>
      </div>

      <div className="landscape-control-block">
        <span className="landscape-control-label" title="选中后只突出这种情绪对应的细线／圆点，其他会淡化">情绪高亮</span>
        <div className="filter-group" role="group" aria-label="情绪高亮">
          {EMOTION_OPTIONS.map((opt) => {
            const active = highlightEmotion === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={cn("filter-chip", active && "active")}
                aria-pressed={active}
                onClick={() => onHighlightChange(active ? null : opt.value)}
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
        <button
          type="button"
          className="btn btn-ghost sm"
          title="返回 3D 心理景观可视化"
          onClick={onExitToVisualization}
        >
          ← 返回可视化
        </button>
        <label className="settings-toggle" title="降低或关闭动态效果">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => onReducedMotionChange(e.target.checked)}
          />
          静态模式
        </label>
        <label
          className="settings-toggle"
          title="导出图片底部附带原始文字"
        >
          <input
            type="checkbox"
            checked={watermark}
            onChange={(e) => onWatermarkChange(e.target.checked)}
          />
          附带原始文字水印
        </label>
        <button
          type="button"
          className="btn btn-secondary sm"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? "导出中…" : "导出图片"}
        </button>
      </div>
    </div>
  );
}
