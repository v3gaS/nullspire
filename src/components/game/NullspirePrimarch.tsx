"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { distToCam, worldPos } from "@/lib/game/math";

/** Final boss — Nullspire Primarch at the Null Core. */
export function NullspirePrimarch() {
  const bodyRef = useRef<THREE.Mesh>(null);
  const hp = useRef(900);
  const dead = useRef(false);
  const phase = useRef(1);
  const cooldown = useRef(0);
  const windup = useRef(0);
  const engaged = useRef(false);

  useFrame((state, dt) => {
    const mesh = bodyRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;

    const cam = state.camera.position;
    const dist = distToCam(mesh, cam);
    const wp = worldPos(mesh);
    if (wp.z > -110) return;
    if (dist < 35) engaged.current = true;

    if (engaged.current) {
      useGameStore.getState().setBoss({
        name: "Nullspire Primarch",
        hp: hp.current,
        maxHp: 900,
        phase: phase.current,
      });
    }

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      useGameStore.getState().clearBoss();
      useGameStore.getState().setScreen("victory");
      useGameStore
        .getState()
        .setObjective("Primarch destroyed — Nullspire is quiet");
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.8);
      combatFx.pushBoom(worldPos(mesh), "#c084fc", 7);
      useFxStore.getState().pulseShake(0.32, 500);
      useFxStore.getState().pulseKill();
      return;
    }

    if (!engaged.current) return;

    const next = hp.current > 600 ? 1 : hp.current > 300 ? 2 : 3;
    if (next !== phase.current) {
      phase.current = next;
      useGameStore
        .getState()
        .setObjective(`Nullspire Primarch — Phase ${phase.current}`);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.5);
    }

    const t = state.clock.elapsedTime;
    mesh.position.y = 4 + Math.sin(t * 0.8) * 0.8;
    mesh.rotation.y += dt * (0.3 + phase.current * 0.35);
    mesh.rotation.x = Math.sin(t * 0.5) * 0.15;

    cooldown.current = Math.max(0, cooldown.current - dt);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const muzzle = worldPos(mesh).clone().add(new THREE.Vector3(0, 1.5, 0));
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      mat.emissiveIntensity = 2.2 + Math.sin(t * 20) * 0.6;
      if (Math.random() < dt * 12) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fde68a", 0.06);
      }
      if (windup.current <= 0) {
        cooldown.current = phase.current === 3 ? 0.9 : 1.4;
        useGameStore.getState().damagePlayer(6 + phase.current * 2);
        if (phase.current >= 2 && dist < 14) {
          useGameStore.getState().damagePlayer(4);
        }
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.4);
        combatFx.pushBeam(muzzle, cam.clone(), "#c084fc", 0.18);
        combatFx.pushImpact(cam.clone(), "#c084fc");
        useFxStore.getState().pulseShake(0.1, 160);
      }
    } else if (dist < 30 && cooldown.current <= 0) {
      windup.current = 0.55;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.24);
    } else {
      mat.emissiveIntensity = 0.8 + phase.current * 0.5;
    }
  });

  return (
    <group position={[0, 0, -130]}>
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[18, 18, 0.4, 48]} />
          <meshStandardMaterial
            color="#1a1028"
            emissive="#2e1065"
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.6}
          />
        </mesh>
      </RigidBody>
      {/* Collapsing bridge stubs */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.4, 12]}>
        <mesh>
          <boxGeometry args={[4, 0.35, 10]} />
          <meshStandardMaterial color="#312e81" metalness={0.6} roughness={0.4} />
        </mesh>
      </RigidBody>
      <mesh
        ref={bodyRef}
        position={[0, 4, 0]}
        castShadow
        userData={{ destructible: true, hp: 900, kind: "boss_primarch" }}
      >
        <torusKnotGeometry args={[2.2, 0.55, 100, 16]} />
        <meshStandardMaterial
          color="#c4b5fd"
          emissive="#7c3aed"
          emissiveIntensity={1.2}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      <pointLight position={[0, 8, 0]} intensity={3} color="#a78bfa" distance={40} />
      {/* Arena cover pillars — Quake duel geometry */}
      {[
        [-8, 1.5, -6],
        [8, 1.5, -6],
        [-10, 1.5, 4],
        [10, 1.5, 4],
      ].map((p, i) => (
        <RigidBody key={`pc-${i}`} type="fixed" colliders="cuboid" position={p as [number, number, number]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 3, 2.2]} />
            <meshStandardMaterial
              color="#2e1065"
              emissive="#4c1d95"
              emissiveIntensity={0.45}
              metalness={0.55}
              roughness={0.4}
            />
          </mesh>
        </RigidBody>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[14, 15, 64]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}
