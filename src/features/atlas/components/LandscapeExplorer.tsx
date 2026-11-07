"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecords } from "@/shared/hooks/useRecords";
import { useWebGLSupport } from "@/shared/hooks/useWebGLSupport";
import { useReducedMotion } from "@/shared/utils/useReducedMotion";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Spinner } from "@/shared/components/Spinner";
import { EmptyState } from "@/shared/components/EmptyState";
import { AtlasFallback } from "./AtlasFallback";
import { DetailAside } from "./DetailAside";
import { ResonanceFlowView } from "./resonance/ResonanceFlowView";
import { recordToAtlasNode } from "../adapters/recordToAtlasNode";
import { deriveVisualState } from "../visualState";
import { mapToVisualParameters } from "../visualParams";
import { lastDaysRange } from "@/shared/utils/date";
import type { EmotionTag, MoodRecord } from "@/domain/entities/MoodRecord";
import type { LandscapeMode } from "./landscape/types";
import { LandscapeScene } from "./landscape/LandscapeScene";
import { LandscapeControls } from "./landscape/LandscapeControls";

type RangePreset = "7d" | "30d" | "all";

const LOW_COVERAGE = 0.15;

export function LandscapeExplorer() {
  const { records, loading, error, reload } = useRecords();
  const webglSupported = useWebGLSupport();
  const osReduced = useReducedMotion();
  const router = useRouter();

  const [mode, setMode] = useState<LandscapeMode>("fluid");
  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [playhead, setPlayhead] = useState(1);
  const [highlightEmotion, setHighlightEmotion] = useState<EmotionTag | null>(
    null
  );
  const [forceStatic, setForceStatic] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sceneFailed, setSceneFailed] = useState(false);

  const reducedMotion = forceStatic || osReduced;

  const range = useMemo(() => {
    if (rangePreset === "7d") {
      const r = lastDaysRange(7);
      return { start: r.from, end: r.to };
    }
    if (rangePreset === "30d") {
      const r = lastDaysRange(30);
      return { start: r.from, end: r.to };
    }
    if (records.length > 0) {
      const times = records.map((r) => new Date(r.recordedAt).getTime());
      const start = new Date(Math.min(...times));
      start.setHours(0, 0, 0, 0);
      const end = new Date(Math.max(...times));
      return { start: start.toISOString(), end: end.toISOString() };
    }
    const r = lastDaysRange(30);
    return { start: r.from, end: r.to };
  }, [rangePreset, records]);

  const inRange = useMemo(
    () =>
      records.filter(
        (r) => r.recordedAt >= range.start && r.recordedAt <= range.end
      ),
    [records, range]
  );

  const cutoffMs = useMemo(() => {
    const startMs = new Date(range.start).getTime();
    const endMs = new Date(range.end).getTime();
    return startMs + (endMs - startMs) * playhead;
  }, [range, playhead]);

  const visibleRecords = useMemo(
    () => inRange.filter((r) => new Date(r.recordedAt).getTime() <= cutoffMs),
    [inRange, cutoffMs]
  );

  // Positions are computed from the full in-range set so they stay stable while
  // the playhead scrubs; only the visible subset is rendered.
  const inRangeNodes = useMemo(() => recordToAtlasNode(inRange), [inRange]);
  const visibleIds = useMemo(
    () => new Set(visibleRecords.map((r) => r.id)),
    [visibleRecords]
  );
  const nodes = useMemo(
    () => inRangeNodes.filter((n) => visibleIds.has(n.recordId)),
    [inRangeNodes, visibleIds]
  );

  const visualState = useMemo(
    () => deriveVisualState(visibleRecords, range),
    [visibleRecords, range]
  );
  const visualParams = useMemo(
    () => mapToVisualParameters(visualState, reducedMotion),
    [visualState, reducedMotion]
  );

  const selectedRecord: MoodRecord | null = useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  function handleRangeChange(preset: RangePreset) {
    setRangePreset(preset);
    setPlayhead(1);
    setResetKey((k) => k + 1);
  }

  function resetView() {
    setResetKey((k) => k + 1);
  }

  function locate(view: "atlas" | "timeline", recordId: string) {
    if (view === "timeline") router.push(`/timeline?focus=${recordId}`);
    else setSelectedId(recordId);
  }

  const showFallback = webglSupported === false || sceneFailed;
  const lowCoverage =
    visualState.recordCount > 0 && visualState.dataCoverage < LOW_COVERAGE;
  const emptyVisible = visualState.recordCount === 0 && records.length > 0;
  const isResonance = mode === "resonance";

  return (
    <div className="atlas-page landscape-page">
      <header className="atlas-toolbar">
        <div>
          <h1 className="page-title">心理景观</h1>
          <p className="page-subtitle">
            {isResonance
              ? "时序共振流：把每次记录中的情绪、内心是否一致，以及外部事件，沿着时间铺开回看。仅作感受可视化，缺失数据代表未知，而非平静。"
              : "基于你的真实记录生成的动态 3D 世界：强度决定起伏，时间决定流动，情绪决定色彩。缺失数据代表未知，而非平静。"}
          </p>
        </div>
      </header>

      {isResonance ? (
        <ResonanceFlowView
          records={records}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onLocate={locate}
          onExitToVisualization={() => setMode("fluid")}
        />
      ) : (
        <>
          <LandscapeControls
            mode={mode}
            onModeChange={setMode}
            rangePreset={rangePreset}
            onRangeChange={handleRangeChange}
            playhead={playhead}
            onPlayheadChange={setPlayhead}
            highlightEmotion={highlightEmotion}
            onHighlightChange={setHighlightEmotion}
            reducedMotion={reducedMotion}
            onReducedMotionChange={setForceStatic}
            onResetView={resetView}
          />

          <div className="atlas-body">
            <div className="atlas-canvas">
              {loading ? (
                <Spinner label="正在加载记录…" />
              ) : error ? (
                <AtlasFallback
                  title="无法读取本地记录"
                  message="请检查浏览器本地存储设置，或尝试刷新页面。"
                />
              ) : showFallback ? (
                <AtlasFallback
                  title="3D 场景暂不可用"
                  message="当前环境不支持 WebGL，或场景初始化失败。你仍然可以通过时间线查看和管理记录。"
                />
              ) : records.length === 0 ? (
                <AtlasFallback
                  title="还没有记录"
                  message="创建第一条状态记录后，它就会在这个动态景观中浮现。"
                />
              ) : (
                <ErrorBoundary
                  resetKey={resetKey}
                  onError={() => setSceneFailed(true)}
                  fallback={
                    <AtlasFallback
                      title="3D 场景初始化失败"
                      message="场景遇到了问题。你可以继续使用时间线管理记录。"
                    />
                  }
                >
                  <LandscapeScene
                    mode={mode}
                    nodes={nodes}
                    visualParams={visualParams}
                    clusters={visualState.clusters}
                    reducedMotion={reducedMotion}
                    selectedId={selectedId}
                    highlightEmotion={highlightEmotion}
                    onSelect={setSelectedId}
                    resetKey={resetKey}
                  />
                </ErrorBoundary>
              )}
            </div>

            <DetailAside
              selectedRecord={selectedRecord}
              onClose={() => setSelectedId(null)}
              onLocate={locate}
            >
              <p className="muted">
                点击场景中的光点查看对应的真实记录。拖动时间轴可以观察状态随时间的演变。
              </p>
              {lowCoverage ? (
                <p className="landscape-note">
                  当前范围内的记录较少，场景结构仅作参考，不代表任何心理测量结论。
                </p>
              ) : null}
              {emptyVisible ? (
                <p className="landscape-note">
                  把时间轴拖到最右，记录会在场景中逐渐浮现。
                </p>
              ) : null}
            </DetailAside>
          </div>
        </>
      )}
    </div>
  );
}
