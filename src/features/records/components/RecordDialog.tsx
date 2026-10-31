"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { QuickRecordForm } from "./QuickRecordForm";
import { RecordDetail } from "./RecordDetail";
import { useRecords } from "@/shared/hooks/useRecords";
import { useToast } from "@/shared/components/Toast";
import { AppError } from "@/domain/repositories/AppError";
import type {
  MoodRecord,
  MoodRecordDraft,
} from "@/domain/entities/MoodRecord";

type DialogMode = "create" | "view" | "edit";

interface RecordDialogProps {
  open: boolean;
  mode: DialogMode;
  record?: MoodRecord;
  onClose: () => void;
  onLocate?: (view: "atlas" | "timeline", recordId: string) => void;
}

function errorMessage(error: unknown): string {
  if (AppError.isAppError(error)) return error.message;
  return error instanceof Error ? error.message : "操作失败，请重试。";
}

export function RecordDialog({
  open,
  mode,
  record,
  onClose,
  onLocate,
}: RecordDialogProps) {
  const { createRecord, updateRecord, deleteRecord } = useRecords();
  const { notify } = useToast();
  const [currentMode, setCurrentMode] = useState<DialogMode>(mode);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentMode(mode);
      setDeleting(false);
    }
  }, [open, mode]);

  async function handleSubmit(draft: MoodRecordDraft) {
    try {
      if (currentMode === "edit" && record) {
        await updateRecord(record.id, draft);
        notify("记录已更新", "success");
      } else {
        await createRecord(draft);
        notify("记录已保存", "success");
      }
      onClose();
    } catch (err) {
      notify(errorMessage(err), "error");
    }
  }

  async function handleDelete() {
    if (!record) return;
    setDeleting(true);
    try {
      await deleteRecord(record.id);
      notify("记录已删除", "success");
      onClose();
    } catch (err) {
      notify(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  const title =
    currentMode === "edit"
      ? "编辑记录"
      : currentMode === "view"
        ? "记录详情"
        : "快速记录";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {currentMode === "view" && record ? (
        <RecordDetail
          record={record}
          deleting={deleting}
          onEdit={() => setCurrentMode("edit")}
          onDelete={handleDelete}
          onLocate={
            onLocate
              ? (view) => onLocate(view, record.id)
              : undefined
          }
        />
      ) : (
        <QuickRecordForm
          initial={currentMode === "edit" ? record : undefined}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={currentMode === "edit" ? "保存修改" : "保存记录"}
        />
      )}
    </Modal>
  );
}
