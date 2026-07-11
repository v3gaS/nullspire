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
  [7.5, 0.7, -4],
  [-8, 0.7, -5],
  [9, 0.7, -14],
  [-11, 0.7, -16],
  [12, 0.7, -28],
  [-10, 0.7, -30],
  [2, 0.7, -36],
  [0, 0.7, -44],
  [-5, 0.7, -58],
  [-8, 0.7, -72],
  [9, 0.7, -78],
  [-4, 0.7, -126],
  [3, 0.7, -128],
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
    combatFx.pushBoom(origin, "#ff7a18", 3.5);
    useFxStore.getState().pulseShake(0.14, 180);
    combatFx.pushImpact(origin, "#ffb347");
    combatFx.pushImpact(origin.clone().add(new THREE.Vector3(0.4, 0.6, -0.2)), "#f8fafc");
    combatFx.pushImpact(origin.clone().add(new THREE.Vector3(-0.3, 0.4, 0.3)), "#ff4466");
    useFxStore.getState().pulseShake(0.32, 420);
    playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.82);

    // Chain damage + physics blast
    scene.traverse((obj) => {
      if (!obj.userData?.destructible || !obj.visible) return;
      if (obj === mesh) return;
      const op = worldPos(obj);
      const dist = op.distanceTo(origin);
      if (dist < 9.2) {
        if (obj.userData.kind === "barrel") {
          obj.userData.hp = 0;
        } else {
          applyHit(obj, Math.round(62 * (1 - dist / 9.2)), origin);
        }
        impulseRigid(obj, op.clone().sub(origin), 22);
        staggerObject(obj, origin, 1.05);
      }
    });

    const cam = camera.position;
    if (cam.distanceTo(origin) < 14) {
      const blast = cam.clone().sub(origin).normalize();
      playerPhysics.pushKnock(blast.x * 13, 6.2, blast.z * 13);
      playerPhysics.punch(0.14);
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
        <cylinderGeometry args={[0.48, 0.52, 1.2, 10]} />
        <meshStandardMaterial
          color="#c2410c"
          emissive="#7c2d12"
          emissiveIntensity={0.65}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.22, 10]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.1}
          metalness={0.3}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.6}
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
