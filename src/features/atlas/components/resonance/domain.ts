import type { ResonanceSeries, TimeDomain } from "./types";

/** Minimum rendered time span: keeps a single slice from collapsing to a point. */
const MIN_SPAN_MS = 12 * 60 * 60 * 1000;
/** Minimum zoomed-in span (a zoom cannot go below this). */
const MIN_ZOOM_SPAN_MS = 30 * 60 * 1000;

/**
 * Full visible time domain for a series, padded so anchors do not sit on the
 * chart borders. Deterministic.
 */
export function fullDomainOf(series: ResonanceSeries): TimeDomain {
  const { from, to } = series.meta;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    const center = Number.isFinite(from) ? from : Date.now();
    return { d0: center - MIN_SPAN_MS / 2, d1: center + MIN_SPAN_MS / 2 };
  }
  const pad = Math.max((to - from) * 0.06, MIN_SPAN_MS * 0.35);
  return { d0: from - pad, d1: to + pad };
}

function clampToFull(domain: TimeDomain, full: TimeDomain): TimeDomain {
  const span = Math.max(domain.d1 - domain.d0, MIN_ZOOM_SPAN_MS);
  let { d0 } = domain;
  let { d1 } = domain;
  if (span >= full.d1 - full.d0) return { ...full };
  if (d0 < full.d0) {
    d0 = full.d0;
    d1 = d0 + span;
  }
  if (d1 > full.d1) {
    d1 = full.d1;
    d0 = Math.max(full.d0, d1 - span);
  }
  return { d0, d1 };
}

/** Zoom by `factor` (<1 in, >1 out) keeping `anchorT` fixed. Clamped to full. */
export function zoomAt(
  domain: TimeDomain,
  full: TimeDomain,
  factor: number,
  anchorT: number
): TimeDomain {
  const clamped = Math.min(Math.max(factor, 0.05), 8);
  const span = (domain.d1 - domain.d0) * clamped;
  const leftRatio = (anchorT - domain.d0) / (domain.d1 - domain.d0);
  const next: TimeDomain = {
    d0: anchorT - span * leftRatio,
    d1: anchorT + span * (1 - leftRatio),
  };
  return clampToFull(next, full);
}

/** Pan by a time delta, clamped so the window stays inside full. */
export function panBy(domain: TimeDomain, full: TimeDomain, deltaT: number): TimeDomain {
  return clampToFull(
    { d0: domain.d0 + deltaT, d1: domain.d1 + deltaT },
    full
  );
}

/** Keep an existing zoom window valid for a (possibly changed) full domain. */
export function clampDomain(domain: TimeDomain, full: TimeDomain): TimeDomain {
  return clampToFull(domain, full);
}
