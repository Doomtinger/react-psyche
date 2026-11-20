"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { useToast } from "@/shared/components/Toast";
import { useReducedMotion } from "@/shared/utils/useReducedMotion";
import { DIMENSIONS, PICK_COUNT, PORTRAIT_IMAGES } from "../portraitData";
import { computePortrait } from "../portraitEngine";
import { ImageTile } from "./ImageTile";
import { PortraitRadar } from "./PortraitRadar";
import { ShareCard } from "./ShareCard";

/**
 * 人物画像三屏流程：选图 → 生成过渡 → 画像结果。
 * MVP 只验证一件事：选图到画像的映射，能不能让用户产生「被看见」的感觉。
 * 不做注册、不做历史记录；全部计算在浏览器本地完成。
 */

type Stage = "pick" | "generating" | "result";

const GENERATE_MS = 1800;

export function PortraitWizard() {
  const router = useRouter();
  const { notify } = useToast();
  const osReduced = useReducedMotion();

  const [stage, setStage] = useState<Stage>("pick");
  const [selected, setSelected] = useState<string[]>([]);

  // 结果在进入 result 屏时基于当时的选中集合计算一次。
  const [snapshot, setSnapshot] = useState<string[] | null>(null);
  const result = useMemo(
    () => (snapshot ? computePortrait(snapshot) : null),
    [snapshot]
  );

  useEffect(() => {
    if (stage !== "generating") return;
    const wait = osReduced ? 400 : GENERATE_MS;
    const timer = window.setTimeout(() => setStage("result"), wait);
    return () => window.clearTimeout(timer);
  }, [stage, osReduced]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function startGenerate() {
    if (selected.length !== PICK_COUNT) return;
    setSnapshot([...selected]);
    setStage("generating");
  }

  function restart() {
    setSelected([]);
    setSnapshot(null);
    setStage("pick");
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const ready = selected.length === PICK_COUNT;

  if (stage === "pick") {
    return (
      <div className="portrait-page">
        <header className="page-header">
          <div>
            <h1 className="page-title">人物画像</h1>
            <p className="page-subtitle">
              不用分析，选让你停下来的那一眼。
            </p>
          </div>
          <div className="page-header-actions">
            <Button type="text" onClick={handleBack} title="返回上一页">
              ← 返回
            </Button>
          </div>
        </header>

        <p className="portrait-hint">
          从下面的图里选出 {PICK_COUNT} 张「让自己多看一眼的」。没有对错，凭直觉。
        </p>

        <div className="portrait-grid">
          {PORTRAIT_IMAGES.map((img) => (
            <ImageTile
              key={img.id}
              image={img}
              selected={selected.includes(img.id)}
              onClick={() => toggle(img.id)}
            />
          ))}
        </div>

        <div className="portrait-footer">
          <span className="portrait-count" aria-live="polite">
            已选 {selected.length} / {PICK_COUNT}
          </span>
          <Button type="primary" disabled={!ready} onClick={startGenerate}>
            {ready ? "生成画像" : `还差 ${PICK_COUNT - selected.length} 张`}
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "generating" || !result) {
    return (
      <div className="portrait-page portrait-center">
        <div
          className={osReduced ? "radar-generating static" : "radar-generating"}
          aria-hidden="true"
        />
        <p className="portrait-generating-text" role="status">
          正在生成你的画像…
        </p>
      </div>
    );
  }

  const ranked = [...DIMENSIONS].sort(
    (a, b) => result.scores[b.id] - result.scores[a.id]
  );

  return (
    <div className="portrait-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">{result.title}</h1>
          <p className="page-subtitle">你的六维画像。这是一份描述，不是测评。</p>
        </div>
        <div className="page-header-actions">
          <Button type="text" onClick={restart}>
            重新选图
          </Button>
        </div>
      </header>

      <section className="portrait-radar-wrap">
        <PortraitRadar scores={result.scores} reducedMotion={osReduced} />
      </section>

      <section className="portrait-dims">
        {ranked.map((d) => (
          <div className="portrait-dim" key={d.id}>
            <span className="portrait-dim-name">{d.name}</span>
            <span className="portrait-dim-blurb">{d.blurb}</span>
          </div>
        ))}
      </section>

      <section className="portrait-insights">
        <h2 className="portrait-section-title">两点观察</h2>
        {result.insights.map((text, i) => (
          <p className="portrait-insight" key={i}>
            {text}
          </p>
        ))}
      </section>

      <section className="portrait-share">
        <h2 className="portrait-section-title">分享卡</h2>
        <p className="portrait-share-desc">
          分享出去的只有图形和标题，不带分数与观察全文。
        </p>
        <ShareCard title={result.title} scores={result.scores} />
      </section>

      <section className="portrait-feedback">
        <h2 className="portrait-section-title">像你吗？</h2>
        <div className="portrait-feedback-row">
          {["很像", "一般", "不像"].map((label) => (
            <Button
              key={label}
              size="small"
              onClick={() => notify("谢谢反馈，这会帮我们校准画像。", "success")}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
