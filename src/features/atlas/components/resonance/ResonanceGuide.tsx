"use client";

import { useMemo, useState } from "react";
import { axisDateTime, MARKER_COLORS } from "./chartFrame";
import {
  PERTURBATION_LABELS,
  STATE_LABELS,
  TREND_LABELS,
} from "./resonanceEngine";
import type {
  ResonanceSeries,
  ResonanceSlice,
  SliceState,
} from "./types";

/**
 * Plain-language reading aids for the resonance chart. The chart encodes four
 * things at once (height, color, shape, gaps); without an explicit legend the
 * metaphors are guesswork, so every visual channel is spelled out here.
 */

export const STATE_HINTS: Record<SliceState, string> = {
  resonant: "当时的几种感受比较合拍，笔记里多是接纳、允许的表达。",
  conflict: "同时存在方向相反的情绪，或笔记里有压抑、硬撑的表达。",
  isolation: "这段时间被写成麻木／没感觉，或很久没有记录。空白不代表平静。",
  eruption: "在一段平静或断层之后，情绪强度突然升高。",
};

const COMPLEX_STEPS = [
  {
    title: "1 · 先看高低",
    body: "中间较粗的线是「相干度」：越往上，感受与想法越一致；越往下，几种情绪越互相拉扯。它不是成绩，也不是诊断分数。",
  },
  {
    title: "2 · 再看颜色",
    body: "每股彩色细线是一种情绪，离粗线越远、起伏越大，那种情绪越强。粗线的颜色是当时最主导的情绪。颜色只区分情绪种类，不表示好坏。",
  },
  {
    title: "3 · 最后看标记和空白",
    body: "圆点／三角是外部事件；线条断开或变淡，表示很久没有记录或当时写成「麻木」。缺失是未知，不是平静。",
  },
];

const SIMPLE_STEPS = [
  {
    title: "1 · 看高度",
    body: "折线越高，那次记录里的情绪越强。0–10 是把你选的 1–5 档换算成的视觉高度，不是测评分数。",
  },
  {
    title: "2 · 看圆点颜色",
    body: "每个圆点是一次记录，颜色＝当时最主导的情绪，可在右侧色卡对照。",
  },
  {
    title: "3 · 看虚线和标记",
    body: "灰色虚线是长时间没有记录的区间；圆点／三角标记是外部事件。",
  },
];

const TERMS: { term: string; body: string; onlyComplex?: boolean }[] = [
  {
    term: "相干度（-1 ~ +1）",
    body: "根据笔记里的接纳／压抑用词、是否同时出现相反情绪等线索推算的视觉编码，仅供回看，不是心理测量。",
    onlyComplex: true,
  },
  {
    term: "强度 n/10",
    body: "由记录时选择的 1–5 档强度换算而来，用来对齐图形高度，和你填写的档位不是同一个数字。",
  },
  {
    term: "事件的正向／负向",
    body: "来自事件标签或笔记中的事件描述，表示事件性质，与曲线的高低无关。",
  },
  {
    term: "平稳／逐步修复／循环内耗",
    body: "对相邻几次记录走势的形容：持平、逐渐回升、或来回反复。",
  },
];

/** Compact, always-visible reading hint with an expandable glossary. */
export function ResonanceGuideBar({ simpleView }: { simpleView: boolean }) {
  const [open, setOpen] = useState(false);
  const steps = simpleView ? SIMPLE_STEPS : COMPLEX_STEPS;
  const terms = simpleView ? TERMS.filter((t) => !t.onlyComplex) : TERMS;

  return (
    <div className="res-guide-bar">
      <span className="res-guide-tag">怎么读</span>
      <span className="res-guide-summary">
        {simpleView
          ? "横轴＝时间，纵轴＝情绪强度；圆点＝一次记录，颜色＝当时的情绪。悬停圆点看细节，点击打开原记录。"
          : "横轴＝时间，纵轴＝相干度（越往上越自洽）；彩色细线＝当时并存的情绪。悬停图上看解释，点击打开原记录。"}
      </span>
      <button
        type="button"
        className="btn btn-ghost sm res-guide-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "收起指南" : "读图指南 / 术语"}
      </button>

      {open ? (
        <div className="res-guide-popover" role="dialog" aria-label="读图指南">
          <div className="res-guide-popover-head">
            <strong>三步读懂这张图</strong>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => setOpen(false)}
              aria-label="关闭读图指南"
            >
              ×
            </button>
          </div>
          <div className="res-guide-steps">
            {steps.map((s) => (
              <div className="res-guide-step" key={s.title}>
                <b>{s.title}</b>
                <span>{s.body}</span>
              </div>
            ))}
          </div>
          <div className="res-guide-terms">
            <b>名词解释</b>
            {terms.map((t) => (
              <div className="res-guide-term" key={t.term}>
                <b>{t.term}</b>
                <span>{t.body}</span>
              </div>
            ))}
          </div>
          <p className="res-guide-disclaimer">
            仅作感受可视化：图形来自你自己的文字与标签的启发式编码，非心理测量或诊断结论。
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Hover card shown anywhere over the complex chart's time axis. */
export function SliceHoverCard({ slice }: { slice: ResonanceSlice }) {
  const coh = `${slice.coherence > 0 ? "+" : ""}${slice.coherence}`;
  const emotions = slice.emotions.slice(0, 3);
  return (
    <div className="res-hover-inner">
      <div className="res-hover-time">{axisDateTime(slice.t)}</div>
      <dl className="res-hover-rows">
        <div>
          <dt>状态</dt>
          <dd>{STATE_LABELS[slice.state]}</dd>
        </div>
        <div>
          <dt>相干度</dt>
          <dd>{coh}（越接近 +1 越自洽）</dd>
        </div>
        <div>
          <dt>强度</dt>
          <dd>{Math.round(slice.intensity * 10)}/10</dd>
        </div>
        <div>
          <dt>走势</dt>
          <dd>{TREND_LABELS[slice.trend]}</dd>
        </div>
        {slice.perturbation.kind !== "none" ? (
          <div>
            <dt>事件</dt>
            <dd>
              {PERTURBATION_LABELS[slice.perturbation.kind]}
              {slice.perturbation.summary ? ` · ${slice.perturbation.summary}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>
      {emotions.length > 0 ? (
        <div className="res-hover-emotions">
          {emotions.map((e) => (
            <span key={e.tag}>
              <i style={{ background: e.color }} />
              {e.label}
            </span>
          ))}
        </div>
      ) : null}
      <p className="res-hover-hint">{STATE_HINTS[slice.state]}</p>
      {slice.recordIds.length > 1 ? (
        <p className="res-hover-hint">此处合并了 {slice.recordIds.length} 条相近时间的记录。</p>
      ) : null}
      <p className="res-hover-tip">点击这里打开当时的原始记录</p>
    </div>
  );
}

interface LegendRowProps {
  icon: React.ReactNode;
  label: string;
  body: string;
}

function LegendRow({ icon, label, body }: LegendRowProps) {
  return (
    <div className="res-legend-row">
      <span className="res-legend-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="res-legend-body">
        <b>{label}</b>
        {body}
      </span>
    </div>
  );
}

function lineIcon(color: string, width: number, dashed = false) {
  return (
    <svg width="22" height="12" aria-hidden="true">
      <path
        d="M1 6 L21 6"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "3 3" : undefined}
        fill="none"
      />
    </svg>
  );
}

const dotIcon = (color: string) => (
  <svg width="22" height="12" aria-hidden="true">
    <circle cx="11" cy="6" r="3" fill={color} />
  </svg>
);

interface ResonanceLegendProps {
  series: ResonanceSeries;
  simpleView: boolean;
  selectedSliceInfo: { label: string; value: string }[] | null;
}

/** Encoding key for the sidebar; switches with the active view. */
export function ResonanceLegend({
  series,
  simpleView,
  selectedSliceInfo,
}: ResonanceLegendProps) {
  const colors = useMemo(() => {
    const map = new Map<string, { label: string; color: string; hits: number }>();
    for (const slice of series.slices) {
      for (const e of slice.emotions) {
        const prev = map.get(e.tag);
        if (prev) prev.hits += 1;
        else map.set(e.tag, { label: e.label, color: e.color, hits: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.hits - a.hits);
  }, [series]);

  return (
    <div className="resonance-legend">
      {selectedSliceInfo ? (
        <div className="res-legend-group">
          <div className="res-legend-title">当前选中</div>
          <dl className="res-slice-info">
            {selectedSliceInfo.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="res-legend-group">
        <div className="res-legend-title">图上元素</div>
        {simpleView ? (
          <>
            <LegendRow
              icon={lineIcon("#9aa0a6", 2.2)}
              label="实线 · 强度走势"
              body="越高表示那次记录的情绪越强（0–10 为换算后的视觉高度）。"
            />
            <LegendRow
              icon={lineIcon("var(--text-faint)", 1.4, true)}
              label="灰色虚线 · 空白区间"
              body="很久没有记录，或当时写成麻木；缺失不代表平静。"
            />
            <LegendRow
              icon={dotIcon("#5b8def")}
              label="圆点 · 一次记录"
              body="颜色是当时最主导的情绪，点击可打开原记录。"
            />
          </>
        ) : (
          <>
            <LegendRow
              icon={lineIcon("#9aa0a6", 2.4)}
              label="粗线 · 相干度"
              body="整体走势：越高越自洽，越低越拉扯；颜色是当时最主导的情绪。"
            />
            <LegendRow
              icon={
                <svg width="22" height="12" aria-hidden="true">
                  <path d="M1 3 Q6 0 11 3 T21 3" stroke="#e0567a" strokeWidth="1.6" fill="none" />
                  <path d="M1 9 Q6 12 11 9 T21 9" stroke="#5b8def" strokeWidth="1.6" fill="none" />
                </svg>
              }
              label="彩色细线 · 情绪"
              body="一股＝一种情绪，离粗线越远表示它越强；反向分叉表示情绪互相冲突。"
            />
            <LegendRow
              icon={lineIcon("var(--text-faint)", 1.4, true)}
              label="断笔／变淡 · 空白"
              body="长时间没有记录或当时麻木，线条会断开或淡化；缺失不代表平静。"
            />
            <LegendRow
              icon={
                <svg width="22" height="12" aria-hidden="true">
                  <rect x="8" y="1" width="6" height="10" fill="rgba(110,168,254,.18)" stroke="#6ea8fe" strokeWidth="1" rx="2" />
                </svg>
              }
              label="蓝色竖带 · 选中时刻"
              body="当前查看的时间点，右侧同步显示原始记录。"
            />
          </>
        )}
      </div>

      <div className="res-legend-group">
        <div className="res-legend-title">事件标记</div>
        <LegendRow
          icon={
            <svg width="22" height="12" aria-hidden="true">
              <circle cx="11" cy="6" r="2.5" fill={MARKER_COLORS.positive} />
              <circle cx="11" cy="6" r="5.5" fill="none" stroke={MARKER_COLORS.positive} strokeWidth="1" />
            </svg>
          }
          label="绿色同心圆"
          body="记录中写到的正向事件。"
        />
        <LegendRow
          icon={
            <svg width="22" height="12" aria-hidden="true">
              <path d="M6 2 L16 2 L11 5.5 Z M6 10 L16 10 L11 6.5 Z" fill="none" stroke={MARKER_COLORS.negative} strokeWidth="1.2" />
            </svg>
          }
          label="红色三角"
          body="记录中写到的负向冲击。"
        />
        <LegendRow
          icon={dotIcon(MARKER_COLORS.weak)}
          label="灰色小点"
          body="轻微扰动。"
        />
        <p className="res-legend-caution">
          注意：事件的正／负与曲线的高／低是两回事，颜色也不代表情绪好坏。
        </p>
      </div>

      {colors.length > 0 ? (
        <div className="res-legend-group">
          <div className="res-legend-title">本图出现的情绪色</div>
          <div className="res-legend-colors">
            {colors.map((c) => (
              <span className="res-legend-color" key={c.label}>
                <i style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="res-legend-disclaimer">
        仅作感受可视化，非心理测量或诊断结论。
      </p>
    </div>
  );
}
