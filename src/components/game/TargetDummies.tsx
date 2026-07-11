"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/** Fewer practice targets — Kenney Blaster Kit target meshes. */
const TARGETS: [number, number, number][] = [
  [4, 0.2, 0],
  [-5, 0.2, -1],
  [9, 0.2, -14],
  [-10, 0.2, -16],
  [6, 0.2, -32],
  [-6, 0.2, -34],
];

function KitTarget({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/assets/models/kenney-blaster/target-large.glb");
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.userData.destructible = true;
        m.userData.hp = 40;
        m.userData.kind = "dummy";
      }
    });
    return c;
  }, [scene]);
  return (
    <primitive object={cloned} position={position} scale={2.4} />
  );
}

export function TargetDummies() {
  return (
    <Suspense fallback={null}>
      <group>
        {TARGETS.map((pos, i) => (
          <KitTarget key={i} position={pos} />
        ))}
      </group>
    </Suspense>
  );
}

useGLTF.preload("/assets/models/kenney-blaster/target-large.glb");
