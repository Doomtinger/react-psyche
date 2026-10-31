"use client";

import { RecordsProvider } from "@/shared/hooks/useRecords";
import { ToastProvider } from "@/shared/components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RecordsProvider>
      <ToastProvider>{children}</ToastProvider>
    </RecordsProvider>
  );
}
