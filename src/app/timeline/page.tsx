"use client";

import { Suspense } from "react";
import { Timeline } from "@/features/timeline/components/Timeline";

export default function TimelinePage() {
  return (
    <Suspense fallback={<p className="muted">加载中…</p>}>
      <Timeline />
    </Suspense>
  );
}
