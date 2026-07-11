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
import { playerPhysics } from "@/lib/game/playerPhysics";

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
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.88);
      combatFx.pushBoom(worldPos(mesh), "#c084fc", 8.5);
      combatFx.pushBoom(worldPos(mesh).clone().add(new THREE.Vector3(0, 2, 0)), "#ffffff", 4.5);
      useFxStore.getState().pulseShake(0.4, 600);
      useFxStore.getState().pulseKill("Nullspire Primarch");
      return;
    }

    if (!engaged.current) return;

    const next = hp.current > 600 ? 1 : hp.current > 300 ? 2 : 3;
    if (next !== phase.current) {
      phase.current = next;
      useGameStore
        .getState()
        .setObjective(`Nullspire Primarch — Phase ${phase.current}`);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.55);
      combatFx.pushBoom(worldPos(mesh), "#ffe066", 4.2);
      useFxStore.getState().pulseShake(0.16, 240);
      playerPhysics.punch(0.12);
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
      mat.emissiveIntensity = 2.6 + Math.sin(t * 24) * 0.7;
      if (Math.random() < dt * 16) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fde68a", 0.08);
      }
      if (windup.current <= 0) {
        cooldown.current = phase.current === 3 ? 0.9 : 1.4;
        useGameStore.getState().damagePlayer(6 + phase.current * 2);
        if (phase.current >= 2 && dist < 14) {
          useGameStore.getState().damagePlayer(4);
          combatFx.pushImpact(cam.clone(), "#c084fc");
          playerPhysics.pushKnock(
            (cam.x - muzzle.x) * 0.1,
            1.5,
            (cam.z - muzzle.z) * 0.1,
          );
        }
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.45);
        combatFx.pushBeam(muzzle, cam.clone(), "#c084fc", 0.22);
        combatFx.pushImpact(cam.clone(), "#c084fc");
        useFxStore.getState().pulseShake(0.12, 180);
      }
    } else if (dist < 30 && cooldown.current <= 0) {
      windup.current = 0.58;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.28);
      combatFx.pushImpact(muzzle, "#fde68a");
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
      <pointLight position={[0, 16, 0]} intensity={2.4} color="#a78bfa" distance={44} />
      <pointLight position={[0, 10, 0]} intensity={1.5} color="#ff7a18" distance={26} />
      {/* Arena cover pillars — Quake duel geometry */}
      {[
        [-8, 1.5, -6],
        [8, 1.5, -6],
        [-10, 1.5, 4],
        [10, 1.5, 4],
        [0, 1.2, -10],
        [-6, 1.2, 9],
        [6, 1.2, 9],
        [-12, 1.3, -2],
        [12, 1.3, -2],
      ].map((p, i) => (
        <RigidBody key={`pc-${i}`} type="fixed" colliders="cuboid" position={p as [number, number, number]}>
          <mesh castShadow>
            <boxGeometry args={[i === 4 ? 3.2 : 2.2, i === 4 ? 2.4 : 3, i === 4 ? 1.4 : 2.2]} />
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
          emissiveIntensity={1.15}
          toneMapped={false}
        />
      </mesh>
      {/* Inner duel ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[5.5, 6.2, 48]} />
        <meshStandardMaterial
          color="#c4b5fd"
          emissive="#a78bfa"
          emissiveIntensity={1.35}
          transparent
          opacity={0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[3.2, 3.6, 40]} />
        <meshStandardMaterial
          color="#ffb347"
          emissive="#ff7a18"
          emissiveIntensity={1.45}
          transparent
          opacity={0.72}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
