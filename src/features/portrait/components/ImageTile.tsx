"use client";

import { useId } from "react";
import type {
  MotifId,
  PortraitImage,
  PortraitVariant,
} from "../portraitData";

/**
 * 内置图卡：每张图是一个小 SVG 场景（渐变基调 + 几何母题）。
 * 本地生成、无外部资源、零加载开销；风格刻意拉开，
 * 避免「选什么都差不多」导致映射失真。
 */

const W = 120;
const H = 90;

const DEFAULT_VARIANT: PortraitVariant = {
  flip: false,
  dx: 0,
  dy: 0,
  rotate: 0,
  scale: 1,
  hueShift: 0,
  gradient: 0,
};

const GRADIENTS = [
  ["0", "0", "1", "1"],
  ["1", "0", "0", "1"],
  ["0", "1", "1", "0"],
  ["1", "1", "0", "0"],
] as const;

function Motif({ motif }: { motif: MotifId }) {
  const fg = "rgba(255,255,255,0.85)";
  const soft = "rgba(255,255,255,0.45)";
  const dim = "rgba(255,255,255,0.22)";

  switch (motif) {
    case "mountains":
      return (
        <g>
          <path d={`M0 70 L28 38 L48 62 L74 26 L120 70 Z`} fill={soft} />
          <path d={`M0 74 L34 52 L62 72 L90 50 L120 74 Z`} fill={dim} />
          <path d={`M8 80 H112`} stroke={fg} strokeWidth={1.5} strokeLinecap="round" />
          <path d={`M52 84 L58 76 L66 82 L74 78`} stroke={fg} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "horizon":
      return (
        <g>
          <circle cx={90} cy={26} r={9} fill={soft} />
          <path d={`M0 56 H120`} stroke={fg} strokeWidth={1.2} />
          <path d={`M14 56 L30 44 L46 56 Z`} fill={dim} />
          <path d={`M78 56 L94 46 L110 56 Z`} fill={dim} />
          {[64, 70, 76].map((y, i) => (
            <path key={y} d={`M${20 + i * 30} ${y} h${16 - i * 3}`} stroke={soft} strokeWidth={1} />
          ))}
        </g>
      );
    case "stars":
      return (
        <g>
          {[
            [18, 20, 1.6],
            [42, 12, 1.1],
            [66, 28, 1.8],
            [94, 16, 1.2],
            [30, 44, 1.3],
            [82, 48, 1.7],
            [108, 36, 1.1],
            [56, 60, 1.2],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? soft : fg} />
          ))}
          <path d={`M22 74 Q44 64 66 74 T110 74`} stroke={dim} strokeWidth={1.4} fill="none" />
        </g>
      );
    case "table":
      return (
        <g>
          <ellipse cx={60} cy={58} rx={34} ry={11} fill={soft} />
          <path d={`M60 58 V26`} stroke={fg} strokeWidth={1.4} />
          <path d={`M60 26 q-9 -12 0 -18 q9 6 0 18`} fill={fg} />
          <circle cx={38} cy={52} r={5} fill={dim} />
          <circle cx={82} cy={52} r={5} fill={dim} />
        </g>
      );
    case "letters":
      return (
        <g>
          <rect x={30} y={22} width={60} height={46} rx={4} fill={soft} transform="rotate(-4 60 45)" />
          {[38, 45, 52, 59].map((y, i) => (
            <path key={y} d={`M${38 + i} ${y} h${38 - i * 3}`} stroke="#1a1a24" strokeWidth={2} strokeLinecap="round" transform="rotate(-4 60 45)" />
          ))}
          <circle cx={86} cy={64} r={7} fill="none" stroke={fg} strokeWidth={1.4} />
        </g>
      );
    case "window":
      return (
        <g>
          <rect x={26} y={16} width={68} height={58} rx={6} fill={dim} />
          <path d={`M60 16 V74 M26 45 H94`} stroke={fg} strokeWidth={1.4} />
          <rect x={34} y={24} width={18} height={14} rx={2} fill={soft} />
          <rect x={68} y={52} width={18} height={14} rx={2} fill={soft} />
        </g>
      );
    case "facade":
      return (
        <g>
          {[24, 42, 60, 78].map((x) =>
            [24, 40, 56].map((y) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={13} height={11} fill={x % 2 ? soft : dim} />
            ))
          )}
          <path d={`M14 76 H106`} stroke={fg} strokeWidth={1.4} />
        </g>
      );
    case "shelves":
      return (
        <g>
          {[24, 42, 60].map((y, row) => (
            <g key={y}>
              <path d={`M22 ${y + 12} H98`} stroke={fg} strokeWidth={1.4} />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect
                  key={i}
                  x={26 + i * 15}
                  y={y + (row % 2 ? 2 : 4)}
                  width={8}
                  height={12 - (row % 2 ? 2 : 4)}
                  fill={i % 2 ? soft : dim}
                />
              ))}
            </g>
          ))}
        </g>
      );
    case "grid":
      return (
        <g>
          {[26, 44, 62].map((y) =>
            [26, 47, 68].map((x) => (
              <rect key={`${x}-${y}`} x={x} y={y} width={14} height={12} rx={2} fill="none" stroke={(x + y) % 3 ? soft : fg} strokeWidth={1.2} />
            ))
          )}
          <rect x={68} y={44} width={14} height={12} rx={2} fill={fg} />
        </g>
      );
    case "stairs":
      return (
        <g>
          {[74, 62, 50, 38, 26].map((y, i) => (
            <path key={y} d={`M${18 + i * 18} ${y + 12} h16 v-12`} stroke={i === 4 ? fg : soft} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          ))}
          <path d={`M88 22 l8 -8 l3 10`} stroke={fg} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "flame":
      return (
        <g>
          <path d={`M60 18 q16 18 8 32 q-5 9 2 14 h-20 q7 -5 2 -14 q-8 -14 8 -32`} fill={soft} />
          <path d={`M60 34 q9 11 4 21 q-3 6 1 9 h-10 q4 -3 1 -9 q-5 -10 4 -21`} fill={fg} />
          <path d={`M44 78 H76`} stroke={dim} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "waves":
      return (
        <g>
          <path d={`M8 30 Q30 18 52 30 T96 30 T120 26`} stroke={fg} strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d={`M4 50 Q26 38 48 50 T92 50 T120 46`} stroke={soft} strokeWidth={2} fill="none" strokeLinecap="round" />
          <path d={`M10 70 Q32 58 54 70 T100 70 T120 66`} stroke={dim} strokeWidth={2} fill="none" strokeLinecap="round" />
          <circle cx={96} cy={38} r={3} fill={fg} />
        </g>
      );
    case "kaleido":
      return (
        <g transform={`translate(${W / 2} ${H / 2})`}>
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d={`M0 0 Q10 -18 0 -34`} stroke={i % 2 ? fg : soft} strokeWidth={1.6} fill="none" />
              <circle cx={0} cy={-26} r={4} fill={i % 2 ? soft : dim} />
            </g>
          ))}
          <circle r={6} fill={fg} />
        </g>
      );
    case "clouds":
      return (
        <g>
          <ellipse cx={42} cy={38} rx={20} ry={11} fill={soft} />
          <ellipse cx={56} cy={32} rx={16} ry={10} fill={soft} />
          <ellipse cx={86} cy={52} rx={22} ry={10} fill={dim} />
          <path d={`M30 66 h24 M66 72 h30`} stroke={soft} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={92} cy={24} r={7} fill="none" stroke={fg} strokeWidth={1.4} />
        </g>
      );
    case "campfire":
      return (
        <g>
          <path d={`M60 44 q10 12 4 22 h-8 q-6 -10 4 -22`} fill={soft} />
          <path d={`M42 66 L78 66 M46 74 L74 74`} stroke={dim} strokeWidth={3} strokeLinecap="round" />
          <circle cx={26} cy={62} r={6} fill={fg} />
          <circle cx={94} cy={62} r={6} fill={fg} />
          <circle cx={34} cy={52} r={4.5} fill={soft} />
          <circle cx={86} cy={52} r={4.5} fill={soft} />
        </g>
      );
    case "lights":
      return (
        <g>
          {[
            [22, 26, 5],
            [48, 40, 6],
            [76, 22, 4],
            [98, 46, 5],
            [36, 60, 4],
            [66, 62, 6],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={i % 2 ? soft : fg} opacity={0.8} />
              <circle cx={x} cy={y} r={r + 5} fill="none" stroke={soft} strokeWidth={0.8} opacity={0.4} />
            </g>
          ))}
          <path d={`M12 78 H108`} stroke={dim} strokeWidth={1.4} />
        </g>
      );
    case "bubbles":
      return (
        <g>
          <rect x={22} y={22} width={44} height={24} rx={12} fill={soft} />
          <path d={`M36 46 l-4 10 l12 -10`} fill={soft} />
          <rect x={58} y={48} width={40} height={20} rx={10} fill={fg} />
          <path d={`M84 68 l4 9 l-12 -9`} fill={fg} />
          {[30, 38, 46].map((x) => (
            <circle key={x} cx={x} cy={34} r={1.6} fill="#1a1a24" />
          ))}
          {[68, 76, 84, 90].map((x) => (
            <path key={x} d={`M${x} 58 h6`} stroke="#1a1a24" strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      );
    case "door":
      return (
        <g>
          <rect x={40} y={18} width={40} height={58} rx={3} fill={dim} />
          <path d={`M44 76 V24 H72 V76`} stroke={fg} strokeWidth={1.4} fill="none" />
          <path d={`M72 24 L88 18 V70 L72 76 Z`} fill={soft} />
          <circle cx={66} cy={52} r={2} fill={fg} />
          <path d={`M20 78 H100`} stroke={fg} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      );
    case "bridge":
      return (
        <g>
          <path d={`M14 58 Q60 18 106 58`} stroke={fg} strokeWidth={1.6} fill="none" />
          <path d={`M14 64 Q60 28 106 64`} stroke={soft} strokeWidth={1.2} fill="none" />
          {[30, 60, 90].map((x) => (
            <path key={x} d={`M${x} ${x === 60 ? 30 : 44} V68`} stroke={dim} strokeWidth={1.2} />
          ))}
          <path d={`M6 72 H114`} stroke={soft} strokeWidth={1.2} />
          <circle cx={60} cy={22} r={4} fill={fg} />
        </g>
      );
    case "compass":
      return (
        <g>
          <circle cx={60} cy={45} r={28} fill={dim} />
          <circle cx={60} cy={45} r={28} fill="none" stroke={fg} strokeWidth={1.4} />
          <path d={`M60 17 V24 M60 66 V73 M32 45 H39 M81 45 H88`} stroke={fg} strokeWidth={1.2} />
          <path d={`M60 45 L74 28 L64 45 Z`} fill={fg} />
          <path d={`M60 45 L46 62 L56 45 Z`} fill={soft} />
          <circle cx={60} cy={45} r={3} fill={fg} />
        </g>
      );
    case "seed":
      return (
        <g>
          <ellipse cx={60} cy={66} rx={16} ry={8} fill={dim} />
          <path d={`M60 66 V40`} stroke={fg} strokeWidth={1.6} strokeLinecap="round" />
          <path d={`M60 48 Q42 44 38 30 Q56 30 60 48`} fill={soft} />
          <path d={`M60 42 Q78 38 82 24 Q64 24 60 42`} fill={fg} />
          <path d={`M28 76 H92`} stroke={soft} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      );
    case "moon":
      return (
        <g>
          <path d={`M74 22 A22 22 0 1 0 84 54 A18 18 0 1 1 74 22 Z`} fill={soft} />
          {[
            [30, 24, 1.5],
            [46, 16, 1.1],
            [92, 44, 1.3],
            [36, 52, 1],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? dim : fg} />
          ))}
          <path d={`M14 70 Q34 62 54 70 T100 68`} stroke={dim} strokeWidth={1.3} fill="none" />
        </g>
      );
    case "thread":
      return (
        <g>
          <circle cx={58} cy={46} r={22} fill={dim} />
          <path
            d={`M36 40 Q58 28 80 40 M38 52 Q58 64 78 52 M46 30 Q70 44 46 60 M70 30 Q48 44 70 60`}
            stroke={soft}
            strokeWidth={1.3}
            fill="none"
          />
          <path d={`M80 40 L104 22`} stroke={fg} strokeWidth={1.2} />
          <circle cx={106} cy={20} r={2.5} fill="none" stroke={fg} strokeWidth={1.2} />
        </g>
      );
  }
}

interface ImageTileProps {
  image: PortraitImage;
  /** Display-only variation; never changes the image's six-dim vector. */
  variant?: PortraitVariant;
  selected?: boolean;
  onClick?: () => void;
}

export function ImageTile({
  image,
  variant = DEFAULT_VARIANT,
  selected,
  onClick,
}: ImageTileProps) {
  const gradientId = useId();
  const [x1, y1, x2, y2] = GRADIENTS[variant.gradient];
  const motifTransform = [
    `translate(${W / 2} ${H / 2})`,
    `rotate(${variant.rotate})`,
    `scale(${(variant.flip ? -1 : 1) * variant.scale} ${variant.scale})`,
    `translate(${-W / 2 + variant.dx} ${-H / 2 + variant.dy})`,
  ].join(" ");

  return (
    <button
      type="button"
      className={selected ? "portrait-tile selected" : "portrait-tile"}
      aria-pressed={selected}
      aria-label={image.label}
      title={image.label}
      onClick={onClick}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            <stop offset="0" stopColor={image.hue[0]} />
            <stop offset="1" stopColor={image.hue[1]} />
          </linearGradient>
        </defs>
        <rect
          width={W}
          height={H}
          fill={`url(#${gradientId})`}
          style={{ filter: `hue-rotate(${variant.hueShift}deg)` }}
        />
        <g transform={motifTransform}>
          <Motif motif={image.motif} />
        </g>
      </svg>
      {selected ? (
        <span className="portrait-tile-check" aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
}
