"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RecordNode } from "./RecordNode";
import type { AtlasNode } from "../types";

interface AtlasSceneProps {
  nodes: AtlasNode[];
  selectedId: string | null;
  onSelect: (recordId: string) => void;
  reducedMotion: boolean;
  resetKey: number;
}

export function AtlasScene({
  nodes,
  selectedId,
  onSelect,
  reducedMotion,
  resetKey,
}: AtlasSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    controlsRef.current?.reset();
  }, [resetKey]);

  return (
    <Canvas camera={{ position: [0, 4, 16], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={["#0b0f1a"]} />
      <ambientLight intensity={0.75} />
      <pointLight position={[12, 14, 10]} intensity={0.9} />
      <pointLight position={[-12, 6, -10]} intensity={0.4} />
      <gridHelper
        args={[48, 24, "#1c2433", "#121826"]}
        position={[0, -0.5, 0]}
      />
      <axesHelper args={[3]} />
      {nodes.map((node) => (
        <RecordNode
          key={node.id}
          node={node}
          selected={node.recordId === selectedId}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={48}
      />
    </Canvas>
  );
}
