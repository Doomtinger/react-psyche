"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { VisualParameters } from "../../visualParams";
import { fieldVertexShader, fieldFragmentShader } from "./fieldShader";

interface FieldMeshProps {
  params: VisualParameters;
  mode: "fluid" | "terrain";
  reducedMotion: boolean;
}

const LERP = 0.05;

/**
 * Data-driven surface. Average intensity sets the base amplitude, intensity
 * variance sets turbulence, and data coverage sets flow speed. The shader only
 * adds subtle life on top of these analytic parameters, so the same records
 * always reproduce the same overall structure.
 */
export function FieldMesh({ params, mode, reducedMotion }: FieldMeshProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: params.waveAmplitude },
      uTurbulence: { value: params.turbulence },
      uSpeed: { value: params.flowSpeed },
      uFrequency: { value: 0.14 },
      uColorA: { value: new THREE.Color(params.colorA) },
      uColorB: { value: new THREE.Color(params.colorB) },
    }),
    // Created once; subsequent changes are applied via the frame loop below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const target = paramsRef.current;
    const u = mat.uniforms;
    u.uTime.value += delta;
    u.uAmplitude.value +=
      (target.waveAmplitude * (modeRef.current === "terrain" ? 1.3 : 1) -
        u.uAmplitude.value) *
      LERP;
    u.uTurbulence.value += (target.turbulence - u.uTurbulence.value) * LERP;
    u.uSpeed.value +=
      ((reducedMotion ? 0 : target.flowSpeed) - u.uSpeed.value) * LERP;
    const freq = modeRef.current === "terrain" ? 0.06 : 0.14;
    u.uFrequency.value += (freq - u.uFrequency.value) * LERP;
    (u.uColorA.value as THREE.Color).lerp(new THREE.Color(target.colorA), LERP);
    (u.uColorB.value as THREE.Color).lerp(new THREE.Color(target.colorB), LERP);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <planeGeometry args={[30, 20, 160, 110]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={fieldVertexShader}
        fragmentShader={fieldFragmentShader}
      />
    </mesh>
  );
}
