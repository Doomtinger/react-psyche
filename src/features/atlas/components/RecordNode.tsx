"use client";

import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { AtlasNode } from "../types";

interface RecordNodeProps {
  node: AtlasNode;
  selected: boolean;
  onSelect: (recordId: string) => void;
}

export function RecordNode({ node, selected, onSelect }: RecordNodeProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={node.position}
      scale={selected ? 1.5 : hovered ? 1.2 : 1}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(node.recordId);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial
        color={node.color}
        emissive={node.color}
        emissiveIntensity={selected ? 0.95 : hovered ? 0.55 : 0.2}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}
