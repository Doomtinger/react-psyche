"use client";

import { DIMENSIONS } from "../portraitData";
import type { PortraitScores } from "../portraitEngine";

/**
 * 正六边形雷达图：3 层背景网格（30/55/80 刻度）+ 轴线 + 单主色数据多边形。
 * 标签与分数用文本色（不用系列色）；动画在 reducedMotion 下跳过。
 */

const SIZE_W = 420;
const SIZE_H = 360;
const CENTER_X = SIZE_W / 2;
const CENTER_Y = SIZE_H / 2;
const R = 118;
const GRID_TICKS = [30, 55, 80];
const START_ANGLE = -Math.PI / 2; // 第一个顶点朝上

const ACCENT = "#6ea8fe";

function pointFor(dimIndex: number, value: number): { x: number; y: number } {
  const angle = START_ANGLE + (dimIndex * 2 * Math.PI) / 6;
  const r = (value / 100) * R;
  return {
    x: CENTER_X + r * Math.cos(angle),
    y: CENTER_Y + r * Math.sin(angle),
  };
}

function hexPoints(radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = START_ANGLE + (i * 2 * Math.PI) / 6;
    return `${CENTER_X + radius * Math.cos(angle)},${CENTER_Y + radius * Math.sin(angle)}`;
  }).join(" ");
}

interface PortraitRadarProps {
  scores: PortraitScores;
  reducedMotion?: boolean;
  /** 分享卡等场景下的紧凑渲染（隐藏标签与分数）。 */
  compact?: boolean;
}

export function PortraitRadar({
  scores,
  reducedMotion = false,
  compact = false,
}: PortraitRadarProps) {
  const dataPoints = DIMENSIONS.map((d, i) => pointFor(i, scores[d.id]));
  const dataPath = `M ${dataPoints.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

  // 顶点标签放在半径外一圈，避免与图形重叠。
  const labelRadius = R + (compact ? 0 : 28);

  return (
    <svg
      viewBox={`0 0 ${SIZE_W} ${SIZE_H}`}
      width="100%"
      role="img"
      aria-label={`六维画像雷达图：${DIMENSIONS.map(
        (d) => `${d.name}${scores[d.id]}`
      ).join("，")}`}
      className="portrait-radar"
    >
      {/* 背景网格：3 层同心六边形 */}
      {GRID_TICKS.map((tick) => (
        <polygon
          key={tick}
          points={hexPoints((tick / 100) * R)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}

      {/* 轴线 */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = pointFor(i, 100);
        return (
          <line
            key={i}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={p.x}
            y2={p.y}
            stroke="var(--border)"
            strokeWidth={0.75}
            opacity={0.6}
          />
        );
      })}

      {/* 数据多边形：从中心生长 */}
      <g
        className={reducedMotion || compact ? undefined : "radar-grow"}
        style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px` }}
      >
        <path
          d={dataPath}
          fill={ACCENT}
          fillOpacity={0.25}
          stroke={ACCENT}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={ACCENT} />
        ))}
      </g>

      {/* 轴标签 + 分数（紧凑模式用于分享卡，只留维度名） */}
      {!compact
        ? DIMENSIONS.map((d, i) => {
            const angle = START_ANGLE + (i * 2 * Math.PI) / 6;
            const lx = CENTER_X + labelRadius * Math.cos(angle);
            const ly = CENTER_Y + labelRadius * Math.sin(angle);
            const anchor =
              Math.abs(Math.cos(angle)) < 0.3
                ? "middle"
                : Math.cos(angle) > 0
                  ? "start"
                  : "end";
            return (
              <g key={d.id}>
                <text
                  x={lx}
                  y={ly - 4}
                  textAnchor={anchor}
                  fontSize={14}
                  fill="var(--text)"
                  fontWeight={500}
                >
                  {d.name}
                </text>
                <text
                  x={lx}
                  y={ly + 13}
                  textAnchor={anchor}
                  fontSize={12}
                  fill="var(--text-faint)"
                >
                  {scores[d.id]}
                </text>
              </g>
            );
          })
        : null}
    </svg>
  );
}
