"use client";

import { useMemo } from "react";
import * as THREE from "three";

const TARGETS: [number, number, number][] = [
  [6, 1.2, -4],
  [-6, 1.2, -8],
  [12, 1.5, -14],
  [0, 5.8, -16],
  [18, 2, -8],
  [-10, 1.2, 2],
];

/** Destructible practice drones for combat baseline. */
export function TargetDummies() {
  const geometry = useMemo(() => new THREE.SphereGeometry(0.55, 16, 16), []);

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
            color="#c45cff"
            emissive="#4a1a6a"
            emissiveIntensity={0.4}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
