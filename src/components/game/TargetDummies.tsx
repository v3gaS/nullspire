"use client";

import { useMemo } from "react";
import * as THREE from "three";

const TARGETS: [number, number, number][] = [
  // Drop Zone practice — immediate frag feed
  [4, 1.1, 0],
  [-5, 1.1, -1],
  [2, 1.1, -6],
  // Approach flanks — rail-pierce practice line
  [9, 1.2, -14],
  [9, 1.2, -18],
  [9, 1.2, -22],
  [-10, 1.2, -16],
  [14, 1.5, -26],
  [0, 5.8, -16],
  [-14, 1.2, -22],
  [6, 1.2, -32],
  [-6, 1.2, -34],
];

/** Blocky practice targets — Quake dummy silhouettes. */
export function TargetDummies() {
  const geometry = useMemo(() => new THREE.BoxGeometry(0.9, 1.6, 0.7), []);

  return (
    <group>
      {TARGETS.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          geometry={geometry}
          castShadow
          userData={{ destructible: true, hp: 36, kind: "dummy" }}
        >
          <meshStandardMaterial
            color="#e8e0d4"
            emissive="#ff7a18"
            emissiveIntensity={0.35}
            roughness={0.55}
            metalness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
