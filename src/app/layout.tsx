import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "./components/Nav";

export const metadata: Metadata = {
  title: "Flow Space · Mind Atlas",
  description:
    "本地优先的心理状态记录与自我觉察工具：快速记录、3D 探索、时间线回看与周期回顾。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <div className="app-shell">
            <Nav />
            <main className="app-main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
