"use client";

import { useRef } from "react";
import { Button } from "antd";
import { DIMENSIONS } from "../portraitData";
import type { PortraitScores } from "../portraitEngine";

/**
 * 分享卡：整卡是一张纯 SVG（无外部资源，可安全绘制到 canvas 导出 PNG）。
 * 分享出去的只有图形和标题——不带维度分数与洞察全文，降低分享心理门槛。
 */

const CARD_W = 720;
const CARD_H = 760;
const CENTER = CARD_W / 2;
const CY0 = 400; // 雷达圆心：标题与图形之间留足间距
const R = 195;
const LABEL_R = R + 36;
const START_ANGLE = -Math.PI / 2;
const ACCENT = "#6ea8fe";

function sharePoint(dimIndex: number, value: number): { x: number; y: number } {
  const angle = START_ANGLE + (dimIndex * 2 * Math.PI) / 6;
  const r = (value / 100) * R;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CY0 + r * Math.sin(angle),
  };
}

interface ShareCardProps {
  title: string;
  scores: PortraitScores;
}

/** 屏上的分享卡预览（同时也是导出的源）。 */
export function ShareCard({ title, scores }: ShareCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const grid = [30, 55, 80].map((tick) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = START_ANGLE + (i * 2 * Math.PI) / 6;
      const r = (tick / 100) * R;
      return `${CENTER + r * Math.cos(angle)},${CY0 + r * Math.sin(angle)}`;
    }).join(" ")
  );

  const dataPoints = DIMENSIONS.map((d, i) => sharePoint(i, scores[d.id]));
  const dataPath = `M ${dataPoints.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

  async function save() {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("render failed"));
        img.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CARD_W * scale;
      canvas.height = CARD_H * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!png) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = "portrait-share-card.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="share-card-wrap">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        className="share-card"
        role="img"
        aria-label={`人物画像分享卡：${title}`}
      >
        <defs>
          <linearGradient id="share-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b2440" />
            <stop offset="1" stopColor="#0e1422" />
          </linearGradient>
          <linearGradient id="share-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6ea8fe" />
            <stop offset="1" stopColor="#9f8fff" />
          </linearGradient>
        </defs>

        <rect width={CARD_W} height={CARD_H} rx={28} fill="url(#share-bg)" />
        <rect
          x={1.5}
          y={1.5}
          width={CARD_W - 3}
          height={CARD_H - 3}
          rx={26.5}
          fill="none"
          stroke="#313c56"
        />

        <text x={CENTER} y={78} textAnchor="middle" fontSize={20} fill="#8a94ad">
          人物画像
        </text>
        <text
          x={CENTER}
          y={136}
          textAnchor="middle"
          fontSize={36}
          fontWeight={600}
          fill="#e7ecf5"
        >
          {title}
        </text>

        {/* 三层背景网格 */}
        {grid.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="#2a3450"
            strokeWidth={1}
          />
        ))}
        {/* 轴线 */}
        {Array.from({ length: 6 }, (_, i) => {
          const p = sharePoint(i, 100);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CY0}
              x2={p.x}
              y2={p.y}
              stroke="#2a3450"
              strokeWidth={0.75}
            />
          );
        })}
        {/* 数据多边形 */}
        <path
          d={dataPath}
          fill={ACCENT}
          fillOpacity={0.25}
          stroke="url(#share-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={5} fill={ACCENT} />
        ))}

        {/* 维度名（分享卡只留维度名，不放分数） */}
        {DIMENSIONS.map((d, i) => {
          const angle = START_ANGLE + (i * 2 * Math.PI) / 6;
          const lx = CENTER + LABEL_R * Math.cos(angle);
          const ly = CY0 + LABEL_R * Math.sin(angle);
          const anchor =
            Math.abs(Math.cos(angle)) < 0.3
              ? "middle"
              : Math.cos(angle) > 0
                ? "start"
                : "end";
          return (
            <text
              key={d.id}
              x={lx}
              y={ly}
              textAnchor={anchor}
              fontSize={19}
              fill="#c5cdde"
            >
              {d.name}
            </text>
          );
        })}

        <text x={CENTER} y={CARD_H - 55} textAnchor="middle" fontSize={18} fill="#808aa0">
          Flow Space · 选六张图，看见自己的形状
        </text>
      </svg>

      <Button onClick={save}>保存分享卡</Button>
    </div>
  );
}
