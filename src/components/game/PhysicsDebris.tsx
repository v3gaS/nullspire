"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  RigidBody,
  type RapierRigidBody,
  type CollisionEnterPayload,
} from "@react-three/rapier";
import { impulseRigid, playerPhysics } from "@/lib/game/playerPhysics";

const DEBRIS: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  mass: number;
}[] = [
  { position: [9, 0.6, -3], size: [0.7, 0.9, 0.7], color: "#94a3b8", mass: 2.2 },
  { position: [11, 0.45, -8], size: [0.55, 0.55, 0.55], color: "#a8a29e", mass: 1.4 },
  { position: [-10, 0.5, -5], size: [0.8, 0.7, 0.5], color: "#78716c", mass: 2.8 },
  { position: [8, 0.4, -14], size: [0.5, 0.5, 0.5], color: "#64748b", mass: 1.2 },
  { position: [-9, 0.55, -12], size: [0.9, 0.8, 0.6], color: "#57534e", mass: 3.2 },
  { position: [10, 0.5, -20], size: [0.6, 0.7, 0.6], color: "#9ca3af", mass: 1.8 },
  { position: [-1, 0.5, -26], size: [0.7, 0.7, 0.7], color: "#78716c", mass: 2.0 },
  { position: [3, 0.55, -47], size: [0.8, 0.9, 0.6], color: "#94a3b8", mass: 2.5 },
  { position: [9, 0.5, -49], size: [0.5, 0.5, 0.5], color: "#a8a29e", mass: 1.3 },
  { position: [-6, 0.5, -41], size: [0.7, 0.8, 0.6], color: "#78716c", mass: 2.2 },
  { position: [6, 0.45, -43], size: [0.55, 0.55, 0.55], color: "#64748b", mass: 1.5 },
  { position: [-7.5, 0.5, 2], size: [0.65, 0.7, 0.55], color: "#94a3b8", mass: 1.9 },
  { position: [7.8, 0.45, 3], size: [0.6, 0.6, 0.6], color: "#a8a29e", mass: 1.6 },
  { position: [5, 0.5, -6], size: [0.7, 0.75, 0.55], color: "#78716c", mass: 2.1 },
];

function DebrisChunk({
  position,
  size,
  color,
  mass,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  mass: number;
}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    const body = bodyRef.current;
    if (!mesh || !body) return;
    mesh.userData.destructible = true;
    mesh.userData.hp = 45;
    mesh.userData.kind = "debris";
    mesh.userData.rigidBody = body;
    mesh.userData.skipHit = false;
  }, []);

  const onBump = (payload: CollisionEnterPayload) => {
    const other = payload.other.rigidBodyObject;
    if (!other || other.userData?.kind === "debris") return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const dir = new THREE.Vector3(
      mesh.position.x - other.position.x,
      0.2,
      mesh.position.z - other.position.z,
    );
    impulseRigid(mesh, dir, 5);
    playerPhysics.pushKnock(-dir.x * 0.35, 0.15, -dir.z * 0.35);
    playerPhysics.punch(0.012);
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      colliders="cuboid"
      mass={mass}
      restitution={0.25}
      friction={0.85}
      linearDamping={0.35}
      angularDamping={0.45}
      canSleep
      onCollisionEnter={onBump}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        userData={{
          destructible: true,
          hp: 45,
          kind: "debris",
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.35}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>
    </RigidBody>
  );
}

/** Dynamic crates/barrels — shoot or blast them for real FPS physics juice. */
export function PhysicsDebris() {
  return (
    <group>
      {DEBRIS.map((d, i) => (
        <DebrisChunk key={i} {...d} />
      ))}
    </group>
  );
}
