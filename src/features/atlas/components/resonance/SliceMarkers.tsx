import { formatDateTime } from "@/shared/utils/date";
import { MARKER_COLORS, xOf } from "./chartFrame";
import {
  PERTURBATION_LABELS,
  STATE_LABELS,
  TREND_LABELS,
} from "./resonanceEngine";
import type { ResonanceSlice, TimeDomain } from "./types";

interface SliceMarkersProps {
  slices: ResonanceSlice[];
  domain: TimeDomain;
  /** Anchor y for each slice (envelope point or intensity point). */
  yAt: (slice: ResonanceSlice) => number;
  selectedSlice: number | null;
  onSelectSlice: (index: number) => void;
  /** True while a pan gesture is in progress; suppresses marker clicks. */
  shouldIgnoreClick?: () => boolean;
}

function markerTooltip(slice: ResonanceSlice): string {
  const lines = [
    formatDateTime(new Date(slice.t).toISOString()),
    `${STATE_LABELS[slice.state]} · ${TREND_LABELS[slice.trend]} · 相干 ${slice.coherence > 0 ? "+" : ""}${slice.coherence}`,
  ];
  if (slice.perturbation.kind !== "none") {
    lines.push(`${PERTURBATION_LABELS[slice.perturbation.kind]} ${slice.perturbation.summary}`);
  }
  if (slice.excerpt) lines.push(slice.excerpt);
  return lines.join("\n");
}

/**
 * Perturbation markers layered over the timeline (fixed shape encoding):
 * - 正向事件 → soft outward ripple (concentric circles)
 * - 负向冲击 → inward-converging vortex triangles
 * - 弱扰动/普通波动 → small faint dot
 * Clicking a marker opens the slice's original record.
 */
export function SliceMarkers({
  slices,
  domain,
  yAt,
  selectedSlice,
  onSelectSlice,
  shouldIgnoreClick,
}: SliceMarkersProps) {
  return (
    <g className="resonance-markers">
      {slices.map((slice) => {
        if (slice.isGap || slice.perturbation.kind === "none") return null;
        const x = xOf(slice.t, domain);
        const y = yAt(slice);
        const selected = slice.index === selectedSlice;
        return (
          <g key={slice.index} transform={`translate(${x} ${y})`}>
            {slice.perturbation.kind === "strong-positive" ? (
              <>
                <circle r={3} fill={MARKER_COLORS.positive} />
                <circle
                  r={7.5}
                  fill="none"
                  stroke={MARKER_COLORS.positive}
                  strokeWidth={1.2}
                  opacity={0.55}
                />
                <circle
                  className="res-pulse"
                  r={5}
                  fill="none"
                  stroke={MARKER_COLORS.positive}
                  strokeWidth={1}
                />
              </>
            ) : null}
            {slice.perturbation.kind === "strong-negative" ? (
              <>
                <path
                  d="M -6 -10 L 6 -10 L 0 -2.5 Z"
                  fill="none"
                  stroke={MARKER_COLORS.negative}
                  strokeWidth={1.4}
                />
                <path
                  d="M -6 10 L 6 10 L 0 2.5 Z"
                  fill="none"
                  stroke={MARKER_COLORS.negative}
                  strokeWidth={1.4}
                />
              </>
            ) : null}
            {slice.perturbation.kind === "weak" ? (
              <circle
                r={1.8}
                fill={MARKER_COLORS.weak}
                opacity={0.85}
              />
            ) : null}
            {selected ? (
              <circle
                r={10}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.2}
                opacity={0.9}
              />
            ) : null}
            <circle
              className="res-hit"
              r={13}
              fill="transparent"
              onClick={() => {
                if (shouldIgnoreClick?.()) return;
                onSelectSlice(slice.index);
              }}
            >
              <title>{markerTooltip(slice)}</title>
            </circle>
          </g>
        );
      })}
    </g>
  );
}
