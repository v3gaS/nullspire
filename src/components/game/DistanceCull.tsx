"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";

/** Hide children when the camera is farther than `maxDist` from `anchor`. */
export function DistanceCull({
  anchor = [0, 0, 0],
  maxDist = 70,
  children,
}: {
  anchor?: [number, number, number];
  maxDist?: number;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const origin = useRef(new THREE.Vector3(...anchor));

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = camera.position.distanceTo(origin.current) < maxDist;
  });

  return <group ref={group}>{children}</group>;
}
