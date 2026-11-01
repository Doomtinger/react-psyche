"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import type { AtlasNode } from "../../adapters/recordToAtlasNode";
import type { VisualCluster } from "../../visualState";
import type { VisualParameters } from "../../visualParams";
import type { LandscapeMode } from "./types";
import { FieldMesh } from "./FieldMesh";
import { LandscapeNodes } from "./LandscapeNodes";
import { StarMap } from "./StarMap";

interface LandscapeSceneProps {
  mode: LandscapeMode;
  nodes: AtlasNode[];
  visualParams: VisualParameters;
  clusters: VisualCluster[];
  reducedMotion: boolean;
  selectedId: string | null;
  highlightEmotion: EmotionTag | null;
  onSelect: (recordId: string) => void;
  resetKey: number;
}

export function LandscapeScene({
  mode,
  nodes,
  visualParams,
  clusters,
  reducedMotion,
  selectedId,
  highlightEmotion,
  onSelect,
  resetKey,
}: LandscapeSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    controlsRef.current?.reset();
  }, [resetKey]);

  return (
    <Canvas camera={{ position: [0, 11, 22], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={["#070b14"]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[12, 14, 10]} intensity={0.85} />
      <pointLight position={[-12, 8, -8]} intensity={0.3} />

      {mode === "starmap" ? (
        <StarMap
          nodes={nodes}
          clusters={clusters}
          clusterVisibility={visualParams.clusterVisibility}
          selectedId={selectedId}
          highlightEmotion={highlightEmotion}
          onSelect={onSelect}
        />
      ) : (
        <>
          <FieldMesh
            params={visualParams}
            mode={mode === "terrain" ? "terrain" : "fluid"}
            reducedMotion={reducedMotion}
          />
          <LandscapeNodes
            nodes={nodes}
            selectedId={selectedId}
            highlightEmotion={highlightEmotion}
            onSelect={onSelect}
          />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={48}
      />
    </Canvas>
  );
}
