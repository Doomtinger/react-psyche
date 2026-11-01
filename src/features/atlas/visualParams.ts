import type { VisualState } from "./visualState";
import { dominantColors } from "./colors";

export interface VisualParameters {
  /** Base surface height driven by average intensity. */
  waveAmplitude: number;
  /** Flow animation speed (0 when motion is reduced). */
  flowSpeed: number;
  /** Surface disturbance driven by intensity variance. */
  turbulence: number;
  /** Normalized density of record particles (0..1). */
  particleDensity: number;
  /** How visible cluster/association structures are (0..1). */
  clusterVisibility: number;
  colorA: string;
  colorB: string;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map analytic state to concrete visual parameters. Deterministic: the same
 * `VisualState` always produces the same parameters, so the scene structure is
 * reproducible. Randomness is reserved for subtle life, never for data shape.
 */
export function mapToVisualParameters(
  state: VisualState,
  reducedMotion: boolean
): VisualParameters {
  const normIntensity =
    state.averageIntensity === null
      ? 0.5
      : clamp01((state.averageIntensity - 1) / 4);
  const normVariance =
    state.intensityVariance === null
      ? 0
      : clamp01(state.intensityVariance / 4);

  const waveAmplitude = lerp(0.5, 2.8, normIntensity);
  const turbulence = lerp(0.15, 1.5, normVariance);
  const flowSpeed = reducedMotion
    ? 0
    : lerp(0.08, 0.28, state.dataCoverage);
  const particleDensity = state.recordDensity;
  const maxClusterStrength = state.clusters.reduce(
    (max, c) => Math.max(max, c.strength),
    0
  );
  const clusterVisibility = reducedMotion
    ? 0
    : clamp01(state.dataCoverage * Math.min(1, maxClusterStrength / 4));

  const { a, b } = dominantColors(state.emotionDistribution);

  return {
    waveAmplitude,
    flowSpeed,
    turbulence,
    particleDensity,
    clusterVisibility,
    colorA: a,
    colorB: b,
  };
}
