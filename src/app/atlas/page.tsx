"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Spinner } from "@/shared/components/Spinner";

const MindAtlas = dynamic(
  () => import("@/features/atlas/components/MindAtlas").then((m) => m.MindAtlas),
  {
    ssr: false,
    loading: () => <Spinner label="加载 3D 场景…" />,
  }
);

export default function AtlasPage() {
  return (
    <Suspense fallback={<Spinner label="加载中…" />}>
      <MindAtlas />
    </Suspense>
  );
}
