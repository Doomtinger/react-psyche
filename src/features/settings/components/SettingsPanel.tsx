"use client";

import { useEffect, useRef, useState } from "react";
import { container } from "@/application/container";
import { useRecords } from "@/shared/hooks/useRecords";
import { useToast } from "@/shared/components/Toast";
import { AppError } from "@/domain/repositories/AppError";
import {
  downloadTextFile,
  timestampedFilename,
} from "@/shared/utils/download";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import type { ImportPreview } from "@/application/ImportService";

const DATA_NOTICE =
  "记录保存在当前浏览器的本地存储（IndexedDB）中。清除浏览器数据、更换设备或浏览器，都可能导致记录无法访问。请定期导出备份。本地存储不等于加密保险库，我们无法保证浏览器永远不会清除这些数据。";

export function SettingsPanel() {
  const { records, reload, deleteAllRecords } = useRecords();
  const { notify } = useToast();

  const [importPreview, setImportPreview] = useState<{
    text: string;
    preview: ImportPreview;
  } | null>(null);
  const [confirmStrategy, setConfirmStrategy] = useState<
    "merge" | "replace" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [reducedMotionPref, setReducedMotionPref] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    container.settingsRepository
      .get<boolean>("preferReducedMotion")
      .then((value) => setReducedMotionPref(Boolean(value)))
      .catch(() => undefined);
  }, []);

  function handleExport() {
    try {
      const json = container.exportService.serializeBackup(records);
      downloadTextFile(timestampedFilename("flow-space-backup", "json"), json);
      notify(`已导出 ${records.length} 条记录`, "success");
    } catch {
      notify("导出失败，请重试。", "error");
    }
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      const text = await file.text();
      const preview = container.importService.computePreview(text, records);
      setImportPreview({ text, preview });
    } catch (err) {
      const message = AppError.isAppError(err)
        ? err.message
        : "无法读取备份文件。";
      notify(message, "error");
    }
  }

  async function runImport(strategy: "merge" | "replace") {
    if (!importPreview) return;
    setBusy(true);
    try {
      const count = await container.importService.importBackup(
        importPreview.text,
        strategy
      );
      await reload();
      notify(`已导入 ${count} 条记录`, "success");
      setImportPreview(null);
      setConfirmStrategy(null);
    } catch (err) {
      const message = AppError.isAppError(err) ? err.message : "导入失败。";
      notify(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAll() {
    setBusy(true);
    try {
      await deleteAllRecords();
      notify("已删除全部记录", "success");
    } catch {
      notify("删除失败，请重试。", "error");
    } finally {
      setBusy(false);
      setConfirmDeleteAll(false);
    }
  }

  async function toggleReducedMotion(next: boolean) {
    setReducedMotionPref(next);
    try {
      await container.settingsRepository.set("preferReducedMotion", next);
    } catch {
      // Non-critical preference; ignore storage failures here.
    }
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">设置</h1>
          <p className="page-subtitle">管理你的本地数据、偏好与备份。</p>
        </div>
      </header>

      <section className="settings-card">
        <h2 className="settings-card-title">本地数据说明</h2>
        <p className="settings-notice">{DATA_NOTICE}</p>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">数据导出</h2>
        <p className="settings-desc">
          将当前记录导出为带版本号的 JSON 备份文件。备份仅保存在你的设备上，不会上传到任何服务器。
        </p>
        <button type="button" className="btn btn-primary" onClick={handleExport}>
          导出数据（{records.length} 条）
        </button>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">数据导入与恢复</h2>
        <p className="settings-desc">
          从本产品格式的备份文件恢复数据。导入前会校验文件，无效文件不会覆盖当前数据。
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={handleFileChosen}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileRef.current?.click()}
        >
          选择备份文件
        </button>

        {importPreview ? (
          <div className="import-preview">
            <p>
              文件版本：v{importPreview.preview.schemaVersion} · 记录数：
              {importPreview.preview.recordCount}
            </p>
            {importPreview.preview.conflicts.length > 0 ? (
              <p className="import-warning">
                检测到 {importPreview.preview.conflicts.length} 条与现有记录 ID
                冲突。
              </p>
            ) : null}
            <div className="import-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setConfirmStrategy("merge")}
              >
                合并导入
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmStrategy("replace")}
              >
                全量替换
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setImportPreview(null)}
              >
                取消
              </button>
            </div>
            <p className="settings-desc">
              合并导入：保留现有记录，冲突 ID 以备份为准更新。全量替换：先清空当前记录再写入备份。
            </p>
          </div>
        ) : null}
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">动态效果偏好</h2>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={reducedMotionPref}
            onChange={(e) => toggleReducedMotion(e.target.checked)}
          />
          尽量减少动态效果
        </label>
        <p className="settings-desc">
          我们也会遵循你操作系统的“减少动态效果”设置。
        </p>
      </section>

      <section className="settings-card danger">
        <h2 className="settings-card-title">删除数据</h2>
        <p className="settings-desc">
          你可以删除单条记录（在时间线中操作），或在此删除全部记录。
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setConfirmDeleteAll(true)}
        >
          删除全部记录
        </button>
      </section>

      <section className="settings-card">
        <h2 className="settings-card-title">数据版本信息</h2>
        <ul className="settings-meta">
          <li>备份格式：flow-space-backup</li>
          <li>Schema 版本：1</li>
          <li>本地数据库：flow-space-db</li>
        </ul>
      </section>

      <ConfirmDialog
        open={confirmStrategy === "replace"}
        title="全量替换当前数据？"
        message="此操作会先清空当前所有记录，再写入备份内容。该操作不可撤销，请确保已导出最新备份。"
        confirmLabel="确认替换"
        destructive
        busy={busy}
        onConfirm={() => runImport("replace")}
        onCancel={() => setConfirmStrategy(null)}
      />
      <ConfirmDialog
        open={confirmStrategy === "merge"}
        title="合并导入？"
        message="现有记录会保留；与备份 ID 冲突的记录将被备份内容覆盖。"
        confirmLabel="确认合并"
        busy={busy}
        onConfirm={() => runImport("merge")}
        onCancel={() => setConfirmStrategy(null)}
      />
      <ConfirmDialog
        open={confirmDeleteAll}
        title="删除全部记录？"
        message="此操作会永久删除当前浏览器中的所有状态记录，且无法通过此操作恢复（除非你已有备份）。导出文件不会受影响。"
        confirmLabel="删除全部"
        destructive
        busy={busy}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </div>
  );
}
