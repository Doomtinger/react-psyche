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
  dayRangeToFilter,
  lastDaysRange,
  toDateInputValue,
} from "@/shared/utils/date";

type Preset = "all" | "7d" | "30d" | "custom";

export function MindAtlas() {
  const { records, loading, error } = useRecords();
  const webglSupported = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sceneFailed, setSceneFailed] = useState(false);

  const filteredRecords = useMemo(() => {
    const fromIso = from ? dayRangeToFilter(from).from : undefined;
    const toIso = to ? dayRangeToFilter(to).to : undefined;
    return records.filter(
      (r) =>
        (!fromIso || r.recordedAt >= fromIso) &&
        (!toIso || r.recordedAt < toIso)
    );
  }, [records, from, to]);

  const nodes = useMemo(
    () => recordToAtlasNode(filteredRecords),
    [filteredRecords]
  );

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedId) ?? null,
    [records, selectedId]
  );

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next === "all") {
      setFrom("");
      setTo("");
    } else if (next === "7d" || next === "30d") {
      const range = lastDaysRange(next === "7d" ? 7 : 30);
      setFrom(range.from.slice(0, 10));
      setTo(toDateInputValue());
    }
  }

  function handleCustomChange(which: "from" | "to", value: string) {
    if (which === "from") setFrom(value);
    else setTo(value);
    setPreset("custom");
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
        <div className="preset-group" role="group" aria-label="时间范围">
          {(["all", "7d", "30d"] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              className={preset === p ? "btn btn-primary sm" : "btn btn-ghost sm"}
              onClick={() => applyPreset(p)}
            >
              {p === "all" ? "全部" : p === "7d" ? "近 7 天" : "近 30 天"}
            </button>
          ))}
        </div>
        <div className="date-range">
          <label className="field-label" htmlFor="atlas-from">
            从
          </label>
          <input
            id="atlas-from"
            type="date"
            className="text-input sm"
            value={from}
            max={to || toDateInputValue()}
            onChange={(e) => handleCustomChange("from", e.target.value)}
          />
          <label className="field-label" htmlFor="atlas-to">
            到
          </label>
          <input
            id="atlas-to"
            type="date"
            className="text-input sm"
            value={to}
            min={from || undefined}
            max={toDateInputValue()}
            onChange={(e) => handleCustomChange("to", e.target.value)}
          />
        </div>
      </div>

      <div className="atlas-body">
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
                onSelect={setSelectedId}
                reducedMotion={reducedMotion}
                resetKey={resetKey}
              />
            </ErrorBoundary>
          )}
        </div>

        {selectedRecord ? (
          <aside className="atlas-detail" aria-label="记录详情">
            <RecordDetail
              record={selectedRecord}
              deleting={false}
              onLocate={locate}
              onEdit={undefined}
              onDelete={undefined}
            />
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => setSelectedId(null)}
            >
              关闭详情
            </button>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
