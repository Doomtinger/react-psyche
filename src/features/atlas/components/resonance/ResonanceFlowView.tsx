"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppError } from "@/domain/repositories/AppError";
import type { EmotionTag, MoodRecord } from "@/domain/entities/MoodRecord";
import { Spinner } from "@/shared/components/Spinner";
import { useReducedMotion } from "@/shared/utils/useReducedMotion";
import { formatDateTime } from "@/shared/utils/date";
import { timestampedFilename } from "@/shared/utils/download";
import { AtlasFallback } from "../AtlasFallback";
import { DetailAside } from "../DetailAside";
import { clampDomain, fullDomainOf, panBy, zoomAt } from "./domain";
import {
  CHART_H,
  CHART_W,
  PAD_L,
} from "./chartFrame";
import { ResonanceControls } from "./ResonanceControls";
import { ResonanceFlow } from "./ResonanceFlow";
import { ResonanceSimpleLine } from "./ResonanceSimpleLine";
import {
  buildResonanceSeries,
  PERTURBATION_LABELS,
  STATE_LABELS,
  TREND_LABELS,
} from "./resonanceEngine";
import type { TimeDomain } from "./types";

interface ResonanceFlowViewProps {
  records: MoodRecord[];
  loading: boolean;
  error: AppError | null;
  selectedId: string | null;
  onSelect: (recordId: string | null) => void;
  onLocate: (view: "atlas" | "timeline", recordId: string) => void;
}

/** Full playback traversal duration at 1x. */
const PLAY_DURATION_S = 22;
const WATERMARK_MAX_LINES = 16;

const SVG_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

function shortStamp(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function downloadViaAnchor(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 时序心理共振流图 — self-contained panel for the landscape page.
 * Independent analysis + render pipeline; only reads the shared records and
 * emotion color library. Placed ahead of the 3D modes in the view switcher.
 */
export function ResonanceFlowView({
  records,
  loading,
  error,
  selectedId,
  onSelect,
  onLocate,
}: ResonanceFlowViewProps) {
  const osReduced = useReducedMotion();
  const [forceStatic, setForceStatic] = useState(false);
  const [simpleView, setSimpleView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [granularity, setGranularity] = useState<"day" | "week">("day");
  const [highlightEmotion, setHighlightEmotion] = useState<EmotionTag | null>(
    null
  );
  const [zoom, setZoom] = useState<TimeDomain | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
  const [watermark, setWatermark] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);

  const reducedMotion = forceStatic || osReduced;
  const complexRef = useRef<SVGSVGElement>(null);
  const simpleRef = useRef<SVGSVGElement>(null);
  const progressRef = useRef(1);

  const series = useMemo(() => buildResonanceSeries(records), [records]);
  const full = useMemo(() => fullDomainOf(series), [series]);
  const domain = zoom ?? full;

  // Keep zoom valid and clear stale selections when records change.
  useEffect(() => {
    setZoom((z) => (z ? clampDomain(z, full) : null));
    setSelectedSlice(null);
  }, [full]);

  // Playback loop: waves grow from left to right.
  useEffect(() => {
    if (!playing || simpleView || reducedMotion) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const next = progressRef.current + (dt * speed) / PLAY_DURATION_S;
      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }
      progressRef.current = next;
      setProgress(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, simpleView, reducedMotion, speed]);

  const setProgressSynced = useCallback((value: number) => {
    progressRef.current = value;
    setProgress(value);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progressRef.current >= 1) setProgressSynced(0);
    setPlaying(true);
  }, [playing, setProgressSynced]);

  const handleProgressChange = useCallback(
    (value: number) => {
      setPlaying(false);
      setProgressSynced(value);
    },
    [setProgressSynced]
  );

  const handleZoom = useCallback(
    (factor: number, anchorT: number) => {
      setZoom((z) => zoomAt(z ?? full, full, factor, anchorT));
    },
    [full]
  );

  const handlePanShift = useCallback(
    (deltaT: number) => {
      setZoom((z) => panBy(z ?? full, full, deltaT));
    },
    [full]
  );

  const handleSelectSlice = useCallback(
    (index: number | null) => {
      setSelectedSlice(index);
      if (index === null) return;
      setPlaying(false);
      const slice = series.slices[index];
      if (slice) onSelect(slice.primaryRecordId);
    },
    [series, onSelect]
  );

  const handleResetView = useCallback(() => {
    setZoom(null);
    setSelectedSlice(null);
    setPlaying(false);
    setProgressSynced(1);
  }, [setProgressSynced]);

  const selectedRecord: MoodRecord | null = useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  const selectedSliceInfo = useMemo(() => {
    if (selectedSlice === null) return null;
    const slice = series.slices[selectedSlice];
    if (!slice) return null;
    const parts = [
      shortStamp(slice.t),
      STATE_LABELS[slice.state],
      TREND_LABELS[slice.trend],
      `相干 ${slice.coherence > 0 ? "+" : ""}${slice.coherence}`,
      `强度 ${Math.round(slice.intensity * 10)}/10`,
    ];
    if (slice.perturbation.kind !== "none") {
      parts.push(
        `${PERTURBATION_LABELS[slice.perturbation.kind]} ${slice.perturbation.summary}`
      );
    }
    if (slice.recordIds.length > 1) {
      parts.push(`含 ${slice.recordIds.length} 条记录（降采样合并）`);
    }
    return parts.join(" · ");
  }, [selectedSlice, series]);

  const exportPng = useCallback(async () => {
    const svg =
      (simpleView ? simpleRef.current : complexRef.current) ??
      complexRef.current ??
      simpleRef.current;
    if (!svg) return;
    setExporting(true);
    setExportFailed(false);
    try {
      const svgNS = "http://www.w3.org/2000/svg";
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", svgNS);
      clone.setAttribute("font-family", SVG_FONT);

      // Export the whole chart, not the partially-revealed playback state.
      clone
        .querySelectorAll("[data-progress-group]")
        .forEach((el) => el.removeAttribute("clip-path"));

      const wmLines: string[] = [];
      if (watermark) {
        wmLines.push(
          `时序心理共振流图 · 导出于 ${formatDateTime(new Date().toISOString())} · 仅作感受可视化，非心理测量或诊断结论`
        );
        for (const slice of series.slices) {
          if (wmLines.length > WATERMARK_MAX_LINES) break;
          if (!slice.excerpt) continue;
          const state = STATE_LABELS[slice.state];
          const coh = `${slice.coherence > 0 ? "+" : ""}${slice.coherence}`;
          wmLines.push(
            `${shortStamp(slice.t)} ｜ ${coh} ${state} ｜ ${slice.excerpt.slice(0, 42)}`
          );
        }
      }
      const extraH =
        wmLines.length > 0 ? 26 + wmLines.length * 15 : 0;

      clone.setAttribute("viewBox", `0 0 ${CHART_W} ${CHART_H + extraH}`);
      clone.setAttribute("width", String(CHART_W));
      clone.setAttribute("height", String(CHART_H + extraH));

      if (wmLines.length > 0) {
        const g = document.createElementNS(svgNS, "g");
        wmLines.forEach((line, i) => {
          const text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", String(PAD_L));
          text.setAttribute("y", String(CHART_H + 20 + i * 15));
          text.setAttribute("font-size", "11");
          text.setAttribute("fill", "rgba(154, 166, 189, 0.8)");
          text.textContent = line;
          g.appendChild(text);
        });
        clone.appendChild(g);
      }

      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("SVG rasterization failed"));
        img.src = svgUrl;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CHART_W * scale;
      canvas.height = (CHART_H + extraH) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#0b0f1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!pngBlob) throw new Error("PNG encoding failed");
      const pngUrl = URL.createObjectURL(pngBlob);
      downloadViaAnchor(pngUrl, timestampedFilename("时序共振流图", "png"));
      URL.revokeObjectURL(pngUrl);
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  }, [simpleView, watermark, series]);

  const chartReady = !loading && !error && records.length > 0;

  return (
    <div className="resonance-body">
      <ResonanceControls
        simpleView={simpleView}
        onSimpleViewChange={setSimpleView}
        playing={playing}
        onTogglePlay={handleTogglePlay}
        progress={progress}
        onProgressChange={handleProgressChange}
        speed={speed}
        onSpeedChange={setSpeed}
        granularity={granularity}
        onGranularityChange={setGranularity}
        onZoomIn={() => handleZoom(1 / 1.5, (domain.d0 + domain.d1) / 2)}
        onZoomOut={() => handleZoom(1.5, (domain.d0 + domain.d1) / 2)}
        onResetView={handleResetView}
        highlightEmotion={highlightEmotion}
        onHighlightChange={setHighlightEmotion}
        reducedMotion={reducedMotion}
        onReducedMotionChange={setForceStatic}
        watermark={watermark}
        onWatermarkChange={setWatermark}
        onExport={() => void exportPng()}
        exporting={exporting}
      />

      <div className="atlas-body">
        <div className="atlas-canvas resonance-canvas">
          {loading ? (
            <Spinner label="正在加载记录…" />
          ) : error ? (
            <AtlasFallback
              title="无法读取本地记录"
              message="请检查浏览器本地存储设置，或尝试刷新页面。"
            />
          ) : records.length === 0 ? (
            <AtlasFallback
              title="还没有记录"
              message="创建第一条状态记录后，时序心理共振流会在这里生长。"
            />
          ) : simpleView ? (
            <ResonanceSimpleLine
              series={series}
              domain={domain}
              granularity={granularity}
              selectedSlice={selectedSlice}
              onSelectSlice={handleSelectSlice}
            />
          ) : (
            <ResonanceFlow
              series={series}
              domain={domain}
              progress={progress}
              playing={playing}
              speed={speed}
              reducedMotion={reducedMotion}
              granularity={granularity}
              highlightEmotion={highlightEmotion}
              selectedSlice={selectedSlice}
              onSelectSlice={handleSelectSlice}
              onZoom={handleZoom}
              onPanShift={handlePanShift}
              svgRef={complexRef}
            />
          )}
        </div>

        <DetailAside
          selectedRecord={selectedRecord}
          onClose={() => onSelect(null)}
          onLocate={onLocate}
        >
          <p className="muted">
            点击图上的事件标记或波纹切片，查看当时写下的原始记录。滚轮缩放、拖拽平移时间轴；播放可回看心理状态如何随时间生长。
          </p>
          {records.length === 1 ? (
            <p className="landscape-note">
              目前只有 1 条记录：至少两条不同时间的记录，才能看出时序上的共振与变化。
            </p>
          ) : null}
          {series.meta.downsampled ? (
            <p className="landscape-note">
              记录超过 90 条，已自动降采样合并切片，保证页面流畅；细节可通过缩放查看。
            </p>
          ) : null}
          {exportFailed ? (
            <p className="landscape-note">导出图片失败，请重试。</p>
          ) : null}
        </DetailAside>
      </div>

      {chartReady ? (
        <div className="resonance-legend">
          <span className="lg">
            <svg width="18" height="12" aria-hidden="true">
              <circle cx="9" cy="6" r="3" fill="#4cc38a" />
            </svg>
            正向事件涟漪
          </span>
          <span className="lg">
            <svg width="18" height="12" aria-hidden="true">
              <path d="M3 1 L15 1 L9 11 Z" fill="none" stroke="#e0586b" strokeWidth="1.4" />
            </svg>
            负向冲击漩涡
          </span>
          <span className="lg">
            <svg width="18" height="12" aria-hidden="true">
              <circle cx="9" cy="6" r="2" fill="#6c788f" />
            </svg>
            弱扰动
          </span>
          <span className="lg res-legend-text">
            顺滑缠绕＝共振自洽 · 反向交叉＝失谐拉扯 · 空白断层＝情感隔离 · 骤然增幅＝延迟爆发
          </span>
          <span className="lg res-legend-text">
            长时间无记录的区间，波纹会自动淡化（缺失不代表平静）
          </span>
          {selectedSliceInfo ? (
            <span className="lg resonance-slice-info">{selectedSliceInfo}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
