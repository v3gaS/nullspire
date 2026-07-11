"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { applyHit } from "@/components/game/WeaponSystem";
import { combatFx } from "@/components/game/CombatVfx";
import { playSfx } from "@/lib/game/audio";
import { useFxStore } from "@/stores/fxStore";
import {
  impulseRigid,
  playerPhysics,
  staggerObject,
} from "@/lib/game/playerPhysics";
import { worldPos } from "@/lib/game/math";

const BARRELS: [number, number, number][] = [
  // Approach cluster — Quake chain setpiece (off spawn pad)
  [9, 0.7, -14],
  [10.5, 0.7, -15.2],
  [8.2, 0.7, -15.8],
  [-11, 0.7, -16],
  [-12.4, 0.7, -17],
  // Mid canyon
  [12, 0.7, -28],
  [-10, 0.7, -30],
  [2, 0.7, -36],
  [3.4, 0.7, -37.2],
  // Deep canyon chain nest
  [0, 0.7, -44],
  [1.4, 0.7, -45.2],
  [-1.2, 0.7, -45.5],
  // Deep approach
  [14, 0.7, -52],
  [15.2, 0.7, -53],
  [-5, 0.7, -58],
];

function ExplosiveBarrel({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<RapierRigidBody>(null);
  const dead = useRef(false);
  const { scene, camera } = useThree();

  useFrame(() => {
    const mesh = meshRef.current;
    const body = bodyRef.current;
    if (!mesh || dead.current) return;
    mesh.userData.destructible = true;
    mesh.userData.kind = "barrel";
    mesh.userData.rigidBody = body;
    if (typeof mesh.userData.hp !== "number") mesh.userData.hp = 28;
    if (mesh.userData.hp > 0) return;

    dead.current = true;
    mesh.visible = false;
    const origin = worldPos(mesh).clone();
    combatFx.pushBoom(origin, "#ff6b2e", 4.2);
    combatFx.pushImpact(origin, "#ffb347");
    useFxStore.getState().pulseShake(0.22, 340);
    playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.72);

    // Chain damage + physics blast
    scene.traverse((obj) => {
      if (!obj.userData?.destructible || !obj.visible) return;
      if (obj === mesh) return;
      const op = worldPos(obj);
      const dist = op.distanceTo(origin);
      if (dist < 8.5) {
        if (obj.userData.kind === "barrel") {
          obj.userData.hp = 0;
        } else {
          applyHit(obj, Math.round(55 * (1 - dist / 8.5)), origin);
        }
        impulseRigid(obj, op.clone().sub(origin), 18);
        staggerObject(obj, origin, 0.9);
      }
    });

    const cam = camera.position;
    if (cam.distanceTo(origin) < 13) {
      const blast = cam.clone().sub(origin).normalize();
      playerPhysics.pushKnock(blast.x * 11, 5.5, blast.z * 11);
      playerPhysics.punch(0.1);
    }

    if (body) {
      body.setEnabled(false);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      colliders="cuboid"
      mass={3.5}
      restitution={0.15}
      friction={0.9}
      linearDamping={0.4}
      angularDamping={0.5}
    >
      <mesh
        ref={meshRef}
        castShadow
        userData={{ destructible: true, hp: 28, kind: "barrel" }}
      >
        <cylinderGeometry args={[0.45, 0.5, 1.15, 10]} />
        <meshStandardMaterial
          color="#c2410c"
          emissive="#7c2d12"
          emissiveIntensity={0.55}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.4}
        />
      </mesh>
    </RigidBody>
  );
}

/** Quake-style explosive barrels — shoot to boom, chain-react nearby. */
export function ExplosiveBarrels() {
  return (
    <group>
      {BARRELS.map((p, i) => (
        <ExplosiveBarrel key={i} position={p} />
      ))}
    </group>
  );
}
