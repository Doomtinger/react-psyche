"use client";

import { Modal } from "antd";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={busy ? undefined : onCancel}
      maskClosable={false}
      keyboard={!busy}
      cancelText={cancelLabel}
      okText={busy ? "处理中…" : confirmLabel}
      okButtonProps={{ danger: destructive, loading: busy }}
      onOk={onConfirm}
      width={480}
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
