"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecords } from "@/shared/hooks/useRecords";
import { useWebGLSupport } from "@/shared/hooks/useWebGLSupport";
import { useReducedMotion } from "@/shared/utils/useReducedMotion";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Spinner } from "@/shared/components/Spinner";
import { RecordDetail } from "@/features/records/components/RecordDetail";
import { AtlasScene } from "./AtlasScene";
import { AtlasFallback } from "./AtlasFallback";
import { recordToAtlasNode } from "../adapters/recordToAtlasNode";
import {
  AntdRangePicker,
  QUICK_RANGE_PRESETS,
  resolveRangeISO,
} from "@/shared/components/AntdRangePicker";
import type { DateRange } from "@/shared/components/AntdRangePicker";

const ATLAS_PRESETS = QUICK_RANGE_PRESETS;

export function MindAtlas() {
  const { records, loading, error } = useRecords();
  const webglSupported = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [sceneFailed, setSceneFailed] = useState(false);

  const filteredRecords = useMemo(() => {
    const { from: fromIso, to: toIso } = resolveRangeISO(range);
    return records.filter(
      (r) =>
        (!fromIso || r.recordedAt >= fromIso) &&
        (!toIso || r.recordedAt < toIso)
    );
  }, [records, range]);

  const nodes = useMemo(
    () => recordToAtlasNode(filteredRecords),
    [filteredRecords]
  );

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  function handleSelect(id: string | null) {
    setSelectedId(id);
    setCollapsed(false);
  }

  function resetView() {
    setResetKey((k) => k + 1);
  }

  function locate(view: "atlas" | "timeline", recordId: string) {
    if (view === "timeline") {
      router.push(`/timeline?focus=${recordId}`);
    } else {
      setSelectedId(recordId);
    }
  }

  const detecting = webglSupported === null;
  const showFallback = webglSupported === false || sceneFailed;

  return (
    <div className="atlas-page">
      <header className="atlas-toolbar">
        <div>
          <h1 className="page-title">Mind Atlas</h1>
          <p className="page-subtitle">
            用 3D 场景探索你的状态记录。X 轴=时间，Y 轴=强度，Z 轴=情绪。颜色仅用于辅助区分。
          </p>
        </div>
        <div className="atlas-toolbar-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetView}
            disabled={showFallback}
          >
            复位视角
          </button>
        </div>
      </header>

      <div className="atlas-controls">
        <AntdRangePicker presets={ATLAS_PRESETS} value={range} onChange={setRange} />
      </div>

      <div
        className={`atlas-body${
          selectedRecord && !collapsed ? "" : " no-detail"
        }`}
      >
        <div className="atlas-canvas">
          {loading || detecting ? (
            <Spinner label={detecting ? "正在检测 3D 支持…" : "正在加载记录…"} />
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
              message="创建第一条状态记录后，它就会出现在 Mind Atlas 中。"
            />
          ) : filteredRecords.length === 0 ? (
            <AtlasFallback
              title="该时间范围内没有记录"
              message="试着放宽时间筛选，或切换到“全部”。"
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
              <AtlasScene
                nodes={nodes}
                selectedId={selectedId}
                onSelect={handleSelect}
                reducedMotion={reducedMotion}
                resetKey={resetKey}
              />
            </ErrorBoundary>
          )}

          {collapsed && selectedRecord ? (
            <button
              type="button"
              className="atlas-detail-toggle"
              onClick={() => setCollapsed(false)}
              title="展开记录详情"
            >
              展开详情 ›
            </button>
          ) : null}
        </div>

        {selectedRecord && !collapsed ? (
          <aside className="atlas-detail" aria-label="记录详情">
            <RecordDetail
              record={selectedRecord}
              deleting={false}
              onLocate={locate}
              onEdit={undefined}
              onDelete={undefined}
            />
            <div className="atlas-detail-actions">
              <button
                type="button"
                className="btn btn-ghost sm"
                onClick={() => setCollapsed(true)}
              >
                收起
              </button>
              <button
                type="button"
                className="btn btn-ghost sm"
                onClick={() => {
                  setSelectedId(null);
                  setCollapsed(false);
                }}
              >
                关闭详情
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
