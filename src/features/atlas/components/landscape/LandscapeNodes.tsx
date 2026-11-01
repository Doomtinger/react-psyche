"use client";

import type { EmotionTag } from "@/domain/entities/MoodRecord";
import type { AtlasNode } from "../../adapters/recordToAtlasNode";

interface LandscapeNodesProps {
  nodes: AtlasNode[];
  selectedId: string | null;
  highlightEmotion: EmotionTag | null;
  onSelect: (recordId: string) => void;
}

/** Every record becomes one selectable light point above the field. */
export function LandscapeNodes({
  nodes,
  selectedId,
  highlightEmotion,
  onSelect,
}: LandscapeNodesProps) {
  return (
    <group>
      {nodes.map((node) => {
        const dim =
          highlightEmotion !== null &&
          !node.emotions.includes(highlightEmotion);
        const selected = selectedId === node.recordId;
        return (
          <mesh
            key={node.id}
            position={node.position}
            scale={selected ? 1.7 : 1}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.recordId);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          >
            <sphereGeometry args={[0.32, 18, 18]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={dim ? 0.12 : 0.7}
              transparent
              opacity={dim ? 0.22 : 1}
              roughness={0.4}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
