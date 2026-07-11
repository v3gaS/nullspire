"use client";

import { useMemo } from "react";
import * as THREE from "three";

const TARGETS: [number, number, number][] = [
  [10, 1.2, -14],
  [-10, 1.2, -16],
  [14, 1.5, -22],
  [0, 5.8, -16],
  [18, 2, -18],
  [-14, 1.2, -20],
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
            color="#5eead4"
            emissive="#134e4a"
            emissiveIntensity={0.45}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
