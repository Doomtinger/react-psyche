"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { EmotionTag } from "@/domain/entities/MoodRecord";
import { emotionColor } from "@/shared/constants/emotions";
import type { AtlasNode } from "../../adapters/recordToAtlasNode";
import type { VisualCluster } from "../../visualState";
import { LandscapeNodes } from "./LandscapeNodes";

interface StarMapProps {
  nodes: AtlasNode[];
  clusters: VisualCluster[];
  clusterVisibility: number;
  selectedId: string | null;
  highlightEmotion: EmotionTag | null;
  onSelect: (recordId: string) => void;
}

const toTuple = (p: number[]): [number, number, number] => [p[0], p[1], p[2]];

/**
 * Consciousness star map: records are nodes, time forms a continuous trajectory,
 * and records sharing the same primary emotion form constellation links.
 * `clusterVisibility` (derived from data coverage) fades association links
 * when there is too little data to read a pattern.
 */
export function StarMap({
  nodes,
  clusters,
  clusterVisibility,
  selectedId,
  highlightEmotion,
  onSelect,
}: StarMapProps) {
  const trajectory = useMemo(
    () => nodes.map((n) => toTuple(n.position)),
    [nodes]
  );

  const constellationLines = useMemo(() => {
    if (clusterVisibility <= 0.01) return [];
    const byId = new Map(nodes.map((n) => [n.recordId, n] as const));
    return clusters
      .filter((c) => c.recordIds.length >= 2)
      .map((cluster) => {
        const points = cluster.recordIds
          .map((id) => byId.get(id))
          .filter((n): n is AtlasNode => Boolean(n))
          .map((n) => toTuple(n.position));
        return {
          id: cluster.id,
          color: emotionColor(cluster.emotion),
          points,
          opacity: 0.25 + clusterVisibility * 0.5,
        };
      })
      .filter((line) => line.points.length >= 2);
  }, [clusters, nodes, clusterVisibility]);

  return (
    <group>
      <LandscapeNodes
        nodes={nodes}
        selectedId={selectedId}
        highlightEmotion={highlightEmotion}
        onSelect={onSelect}
      />
      {trajectory.length >= 2 ? (
        <Line
          points={trajectory}
          color="#5b6b8c"
          lineWidth={1.2}
          transparent
          opacity={0.5}
        />
      ) : null}
      {constellationLines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color={line.color}
          lineWidth={1.4}
          transparent
          opacity={line.opacity}
        />
      ))}
    </group>
  );
}
