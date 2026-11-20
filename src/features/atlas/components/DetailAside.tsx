"use client";

import { Button } from "antd";
import type { MoodRecord } from "@/domain/entities/MoodRecord";
import { RecordDetail } from "@/features/records/components/RecordDetail";

interface DetailAsideProps {
  selectedRecord: MoodRecord | null;
  onClose: () => void;
  onLocate?: (view: "atlas" | "timeline", recordId: string) => void;
  /** Hint content shown while no record is selected. */
  children: React.ReactNode;
  /** Optional legend/footer rendered at the bottom of the panel (e.g. resonance). */
  legend?: React.ReactNode;
}

/**
 * Shared detail sidebar for the landscape page: shows the original record for
 * a selection (3D node click or resonance marker click), otherwise a hint.
 */
export function DetailAside({
  selectedRecord,
  onClose,
  onLocate,
  children,
  legend,
}: DetailAsideProps) {
  return (
    <aside className="atlas-detail" aria-label="记录详情">
      {selectedRecord ? (
        <>
          <RecordDetail
            record={selectedRecord}
            deleting={false}
            onLocate={onLocate}
            onEdit={undefined}
            onDelete={undefined}
          />
          <Button type="text" size="small" onClick={onClose}>
            关闭详情
          </Button>
        </>
      ) : (
        <div className="landscape-hint">{children}</div>
      )}
      {legend}
    </aside>
  );
}
