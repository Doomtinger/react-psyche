import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ResonanceControls } from "./ResonanceControls";

const props = {
  simpleView: false,
  onSimpleViewChange: vi.fn(),
  playing: false,
  onTogglePlay: vi.fn(),
  progress: 1,
  onProgressChange: vi.fn(),
  speed: 1,
  onSpeedChange: vi.fn(),
  granularity: "day" as const,
  onGranularityChange: vi.fn(),
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onResetView: vi.fn(),
  highlightEmotion: null,
  onHighlightChange: vi.fn(),
  reducedMotion: false,
  onReducedMotionChange: vi.fn(),
  watermark: false,
  onWatermarkChange: vi.fn(),
  onExport: vi.fn(),
  exporting: false,
  onExitToVisualization: vi.fn(),
};

describe("ResonanceControls phone mode", () => {
  it("collapses secondary controls and restores them from the more button", () => {
    render(<ResonanceControls {...props} isMobile />);

    expect(screen.getByRole("button", { name: "更多设置" })).toBeTruthy();
    expect(
      document.querySelectorAll(".is-mobile-collapsed").length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "更多设置" }));
    expect(document.querySelectorAll(".is-mobile-collapsed")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "收起设置" })).toBeTruthy();
  });

  it("keeps every control visible on desktop", () => {
    render(<ResonanceControls {...props} isMobile={false} />);
    expect(screen.queryByRole("button", { name: "更多设置" })).toBeNull();
    expect(document.querySelectorAll(".is-mobile-collapsed")).toHaveLength(0);
  });
});
