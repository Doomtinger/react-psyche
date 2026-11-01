"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Spinner } from "@/shared/components/Spinner";
import { LandscapeExplorer } from "@/features/atlas/components/LandscapeExplorer";

const LandscapeExplorerLazy = dynamic(
  () => Promise.resolve(LandscapeExplorer),
  {
    ssr: false,
    loading: () => <Spinner label="加载动态心理景观…" />,
  }
);

export default function LandscapePage() {
  return (
    <Suspense fallback={<Spinner label="加载中…" />}>
      <LandscapeExplorerLazy />
    </Suspense>
  );
}
