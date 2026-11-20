"use client";

import { Modal as AntdModal } from "antd";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Close when the backdrop is clicked (default true). */
  closeOnBackdrop?: boolean;
  labelledBy?: string;
}

/**
 * Project dialog shell built on Ant Design's Modal. Footer is disabled on
 * purpose: callers compose their own action row (form buttons, etc.).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
}: ModalProps) {
  return (
    <AntdModal
      open={open}
      onCancel={onClose}
      title={title}
      footer={null}
      width={520}
      maskClosable={closeOnBackdrop}
      destroyOnHidden
      aria-label={title}
    >
      {children}
    </AntdModal>
  );
}
