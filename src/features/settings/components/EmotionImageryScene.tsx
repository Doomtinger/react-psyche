"use client";

import type { CSSProperties, ReactElement, ReactNode } from "react";
import { IMAGERY, type ImageryId } from "../emotionImagery";

/**
 * Concrete imagery for each feeling: inline SVG + CSS keyframe animation.
 * All motion is slow, smooth and strobe-free; `reducedMotion` / the OS
 * "reduce motion" setting disables every animation via CSS.
 */

const W = 400;
const H = 230;
/** Only one full scene is mounted at a time (inside the dialog). */
const SOFT_FILTER_ID = "imagery-soft-blur";

/** Override a keyframe's duration/delay per element to avoid synchrony. */
function anim(duration: number, delay = 0): CSSProperties {
  return { animationDuration: `${duration}s`, animationDelay: `${delay}s` };
}

interface SceneProps {
  p: string[];
}

function Petals({
  x,
  y,
  color,
  scale = 1,
  count = 5,
}: {
  x: number;
  y: number;
  color: string;
  scale?: number;
  count?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`rotate(${(360 / count) * i})`}>
          <ellipse
            className="img-anim img-breathe"
            cx={0}
            cy={-17}
            rx={9}
            ry={18}
            fill={color}
            opacity={0.55}
            style={anim(9 + i * 0.4, i * 0.35)}
          />
        </g>
      ))}
      <circle r={6} fill={color} opacity={0.85} />
    </g>
  );
}

function CalmLake({ p }: SceneProps) {
  return (
    <>
      {[78, 112, 148, 184].map((y, i) => (
        <line key={y} x1={0} x2={W} y1={y} y2={y} stroke={p[2]} strokeWidth={1} opacity={0.14} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className="img-anim img-ripple"
          cx={200}
          cy={120}
          r={58}
          fill="none"
          stroke={p[0]}
          strokeWidth={1.4}
          style={anim(10, i * 3.3)}
        />
      ))}
      {[
        [68, 66, 4],
        [312, 88, 3],
        [120, 176, 3],
        [284, 182, 4],
        [350, 138, 2],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          className="img-anim img-drift"
          cx={x}
          cy={y}
          r={r}
          fill={p[1]}
          opacity={0.5}
          style={anim(14 + i * 1.7, i * 0.8)}
        />
      ))}
    </>
  );
}

function GentleBloom({ p }: SceneProps) {
  return (
    <>
      <Petals x={200} y={124} color={p[0]} scale={1.5} />
      {[
        [120, 150, 2],
        [158, 92, 2],
        [246, 82, 2.4],
        [282, 148, 2],
        [214, 62, 1.8],
        [96, 108, 1.6],
        [306, 106, 1.8],
        [184, 186, 1.6],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          className="img-anim img-rise"
          cx={x}
          cy={y}
          r={r}
          fill={i % 2 ? p[1] : p[2]}
          opacity={0.75}
          style={anim(8 + (i % 3), i * 0.9)}
        />
      ))}
    </>
  );
}

function RadiantBloom({ p }: SceneProps) {
  return (
    <>
      <Petals x={148} y={132} color={p[2]} scale={0.9} />
      <Petals x={200} y={104} color={p[0]} scale={1.25} />
      <Petals x={258} y={134} color={p[1]} scale={0.85} />
      {Array.from({ length: 18 }, (_, i) => (
        <g key={i} transform={`translate(200 116) rotate(${i * 20})`}>
          <circle
            className="img-anim img-radiate"
            cx={0}
            cy={-14}
            r={2 + (i % 3)}
            fill={i % 2 ? p[1] : p[0]}
            opacity={0.7}
            style={anim(5 + (i % 4), i * 0.22)}
          />
        </g>
      ))}
    </>
  );
}

function SinkingMist({ p }: SceneProps) {
  return (
    <>
      {[
        [110, 80, 95, 42],
        [270, 96, 110, 46],
        [190, 150, 130, 50],
        [330, 170, 80, 38],
      ].map(([x, y, rx, ry], i) => (
        <ellipse
          key={i}
          className="img-anim img-sink"
          cx={x}
          cy={y}
          rx={rx}
          ry={ry}
          fill={p[i % 3]}
          opacity={0.16}
          filter={`url(#${SOFT_FILTER_ID})`}
          style={anim(15 + i * 2, i * 1.3)}
        />
      ))}
      {[
        [82, 30, 0],
        [156, 12, 1],
        [228, 44, 2],
        [304, 20, 3],
        [352, 52, 4],
      ].map(([x, y, i]) => (
        <ellipse
          key={i}
          className="img-anim img-fall"
          cx={x}
          cy={y}
          rx={5}
          ry={9}
          fill={p[1]}
          opacity={0.5}
          style={anim(12 + (i % 3), i * 1.8)}
        />
      ))}
    </>
  );
}

function SoftRain({ p }: SceneProps) {
  return (
    <>
      {[162, 182, 202].map((y, i) => (
        <line key={y} x1={0} x2={W} y1={y} y2={y} stroke={p[0]} strokeWidth={1} opacity={0.2 - i * 0.04} />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <line
          key={i}
          className="img-anim img-rain"
          x1={16 + i * 24}
          x2={11 + i * 24}
          y1={-30}
          y2={-16}
          stroke={p[2]}
          strokeWidth={1}
          opacity={0.45}
          style={anim(2.4 + (i % 3) * 0.25, (i % 7) * 0.32)}
        />
      ))}
      {[
        [96, 186],
        [214, 194],
        [318, 180],
      ].map(([x, y], i) => (
        <circle
          key={i}
          className="img-anim img-ripple"
          cx={x}
          cy={y}
          r={22}
          fill="none"
          stroke={p[1]}
          strokeWidth={1}
          style={anim(8, i * 2.6)}
        />
      ))}
    </>
  );
}

function RestlessParticles({ p }: SceneProps) {
  return (
    <>
      {[110, 260].map((x, i) => (
        <path
          key={i}
          className="img-anim img-spin"
          d={`M ${x - 26} 110 A 26 26 0 0 1 ${x + 20} 92`}
          fill="none"
          stroke={p[2]}
          strokeWidth={1.2}
          opacity={0.35}
          style={anim(12 + i * 4, i * 1.5)}
        />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <circle
          key={i}
          className="img-anim img-wander"
          cx={60 + ((i * 57) % 290)}
          cy={45 + ((i * 43) % 145)}
          r={1.6 + (i % 3) * 0.7}
          fill={p[i % 3]}
          opacity={0.75}
          style={anim(3.2 + (i % 5) * 0.8, i * 0.27)}
        />
      ))}
    </>
  );
}

function CrossCurrents({ p }: SceneProps) {
  return (
    <>
      <path
        className="img-anim img-flow-a"
        d="M -20 78 C 90 40 130 190 220 120 S 340 60 420 128"
        fill="none"
        stroke={p[0]}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="18 12"
        opacity={0.55}
      />
      <path
        className="img-anim img-flow-b"
        d="M -20 156 C 90 194 130 44 220 114 S 340 174 420 106"
        fill="none"
        stroke={p[1]}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="18 12"
        opacity={0.55}
      />
      <circle
        className="img-anim img-spin"
        cx={220}
        cy={116}
        r={30}
        fill="none"
        stroke={p[2]}
        strokeWidth={1.2}
        strokeDasharray="9 8"
        opacity={0.4}
        style={anim(16)}
      />
    </>
  );
}

function EmberCloud({ p }: SceneProps) {
  return (
    <>
      {[
        [160, 108, 70],
        [220, 92, 80],
        [250, 140, 62],
        [190, 152, 66],
        [128, 146, 48],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          className="img-anim img-breathe"
          cx={x}
          cy={y}
          r={r}
          fill={p[i % 2]}
          opacity={0.3}
          filter={`url(#${SOFT_FILTER_ID})`}
          style={anim(8 + i * 0.9, i * 0.7)}
        />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <circle
          key={i}
          className="img-anim img-rise"
          cx={120 + i * 28}
          cy={150 - (i % 3) * 18}
          r={2 + (i % 2)}
          fill={p[2]}
          opacity={0.55}
          style={anim(9 + (i % 3), i * 1.1)}
        />
      ))}
    </>
  );
}

function InwardFog({ p }: SceneProps) {
  return (
    <>
      {[
        [130, 80, 58],
        [270, 84, 62],
        [110, 160, 52],
        [290, 162, 56],
        [200, 116, 72],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          className="img-anim img-contract"
          cx={x}
          cy={y}
          r={r}
          fill={p[i % 3]}
          opacity={0.32}
          filter={`url(#${SOFT_FILTER_ID})`}
          style={anim(10 + i * 1.2, i * 0.8)}
        />
      ))}
      <circle cx={200} cy={116} r={30} fill={p[1]} opacity={0.4} filter={`url(#${SOFT_FILTER_ID})`} />
    </>
  );
}

function NumbHaze({ p }: SceneProps) {
  return (
    <>
      <rect width={W} height={H} fill={p[0]} opacity={0.1} />
      <ellipse
        className="img-anim img-haze"
        cx={200}
        cy={116}
        rx={210}
        ry={105}
        fill={p[1]}
        opacity={0.14}
        filter={`url(#${SOFT_FILTER_ID})`}
        style={anim(20)}
      />
      <line x1={40} x2={360} y1={116} y2={116} stroke={p[2]} strokeWidth={1} opacity={0.12} />
    </>
  );
}

function Release({ p }: SceneProps) {
  return (
    <>
      <g className="img-anim img-fade-in" style={anim(9)}>
        <rect width={W} height={H} fill={p[2]} opacity={0.07} />
        {[86, 122, 158, 194].map((y) => (
          <line key={y} x1={0} x2={W} y1={y} y2={y} stroke={p[1]} strokeWidth={1} opacity={0.2} />
        ))}
        {[
          [76, 72],
          [318, 96],
          [138, 178],
          [286, 176],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill={p[2]} opacity={0.6} />
        ))}
      </g>
      <g className="img-anim img-release" style={anim(9)}>
        <path
          d="M 150 92 C 222 60 254 168 190 154 C 146 144 168 96 214 108"
          fill="none"
          stroke={p[0]}
          strokeWidth={2}
          opacity={0.65}
        />
        <ellipse cx={200} cy={118} rx={70} ry={44} fill={p[0]} opacity={0.16} filter={`url(#${SOFT_FILTER_ID})`} />
      </g>
    </>
  );
}

const SCENES: Record<ImageryId, (props: SceneProps) => ReactElement> = {
  "calm-lake": CalmLake,
  "gentle-bloom": GentleBloom,
  "radiant-bloom": RadiantBloom,
  "sinking-mist": SinkingMist,
  "soft-rain": SoftRain,
  "restless-particles": RestlessParticles,
  "cross-currents": CrossCurrents,
  "ember-cloud": EmberCloud,
  "inward-fog": InwardFog,
  "numb-haze": NumbHaze,
  release: Release,
};

interface SceneViewProps {
  id: ImageryId;
  reducedMotion: boolean;
}

/** Full animated scene shown in the dialog. */
export function EmotionImageryScene({ id, reducedMotion }: SceneViewProps) {
  const spec = IMAGERY[id];
  const Scene = SCENES[id];
  return (
    <div
      className={`imagery-scene${reducedMotion ? " imagery-static" : ""}`}
      style={{ backgroundColor: spec.bg }}
      role="img"
      aria-label={`${spec.name}：${spec.visual}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden="true">
        <defs>
          <filter id={SOFT_FILTER_ID} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <Scene p={spec.palette} />
      </svg>
      <span className="visually-hidden">{spec.motion}</span>
    </div>
  );
}

/** Compact pictogram shown on each emotion tag. */
export function ImageryGlyph({
  id,
  size = 24,
}: {
  id: ImageryId;
  size?: number;
}) {
  const p = IMAGERY[id].palette;
  const stroke = p[0];
  const line = {
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
  };
  const content: Record<ImageryId, ReactNode> = {
    "calm-lake": (
      <>
        <circle cx="12" cy="12" r="3.5" {...line} />
        <circle cx="12" cy="12" r="7.5" {...line} opacity={0.6} />
        <path d="M2 19 H22" {...line} opacity={0.5} />
      </>
    ),
    "gentle-bloom": (
      <>
        {[0, 90, 180, 270].map((a) => (
          <ellipse key={a} cx="12" cy="7" rx="3" ry="5" fill={stroke} opacity={0.55} transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="2" fill={p[1]} />
      </>
    ),
    "radiant-bloom": (
      <>
        <circle cx="12" cy="12" r="3.5" fill={stroke} opacity={0.7} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <circle key={a} cx="12" cy="3" r="1.3" fill={p[1]} transform={`rotate(${a} 12 12)`} />
        ))}
      </>
    ),
    "sinking-mist": (
      <>
        <path d="M2 8 Q7 5 12 8 T22 8 M2 13 Q7 10 12 13 T22 13" {...line} opacity={0.7} />
        <path d="M8 17 l3 3 -3 2" {...line} opacity={0.6} />
      </>
    ),
    "soft-rain": (
      <>
        {[5, 10, 15, 20].map((x) => (
          <path key={x} d={`M${x} 3 l-2 7`} {...line} opacity={0.75} />
        ))}
        <path d="M2 18 Q7 16 12 18 T22 18" {...line} opacity={0.6} />
        <circle cx="12" cy="18" r="3" {...line} opacity={0.5} />
      </>
    ),
    "restless-particles": (
      <>
        {[
          [6, 8],
          [13, 5],
          [18, 11],
          [8, 16],
          [16, 18],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill={stroke} />
        ))}
        <path d="M5 14 A7 7 0 0 1 14 6" {...line} opacity={0.55} />
      </>
    ),
    "cross-currents": (
      <>
        <path d="M2 8 C8 3 14 15 22 9" {...line} />
        <path d="M2 16 C8 21 14 9 22 15" {...line} stroke={p[1]} />
      </>
    ),
    "ember-cloud": (
      <>
        <circle cx="9" cy="13" r="5" fill={stroke} opacity={0.5} />
        <circle cx="15" cy="11" r="6" fill={stroke} opacity={0.4} />
        <circle cx="12" cy="13" r="7" {...line} opacity={0.7} />
        <circle cx="19" cy="5" r="1.3" fill={p[2]} />
      </>
    ),
    "inward-fog": (
      <>
        <circle cx="12" cy="12" r="8.5" {...line} opacity={0.6} />
        <path d="M4 7 l3 3 -3 3 M20 7 l-3 3 3 3" {...line} opacity={0.7} />
        <circle cx="12" cy="12" r="2" fill={stroke} opacity={0.7} />
      </>
    ),
    "numb-haze": (
      <>
        <path d="M3 9 H21 M3 13 H21 M3 17 H21" {...line} opacity={0.45} />
      </>
    ),
    release: (
      <>
        <path d="M14 7 C7 7 6 16 12 17 C17 18 18 11 14 11" {...line} opacity={0.55} />
        <circle cx="18" cy="7" r="1.5" fill={p[2]} />
        <circle cx="6" cy="19" r="1.2" fill={p[2]} opacity={0.7} />
        <path d="M2 20 Q12 18 22 20" {...line} stroke={p[1]} opacity={0.7} />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {content[id]}
    </svg>
  );
}
