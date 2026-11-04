"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";
import { RecordsProvider } from "@/shared/hooks/useRecords";
import { ToastProvider } from "@/shared/components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#6ea8fe",
            borderRadius: 10,
            colorBgContainer: "#151c2c",
            colorBgElevated: "#111726",
            colorBorder: "#232c40",
            colorBorderSecondary: "#232c40",
            colorText: "#e7ecf5",
            colorTextPlaceholder: "#6c788f",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, Helvetica, Arial, sans-serif',
          },
        }}
      >
        <RecordsProvider>
          <ToastProvider>{children}</ToastProvider>
        </RecordsProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
