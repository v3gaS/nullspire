"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { distToCam, worldPos } from "@/lib/game/math";

/** Sector 1 boss — Aegis Warden with 3 phases. */
export function AegisWarden() {
  const bodyRef = useRef<THREE.Mesh>(null);
  const hp = useRef(500);
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
    // Stale matrixWorld can report the boss at local origin (spawn) — ignore until posed
    if (wp.z > -50) return;
    if (dist < 28) engaged.current = true;

    if (engaged.current) {
      useGameStore.getState().setBoss({
        name: "Aegis Warden",
        hp: hp.current,
        maxHp: 500,
        phase: phase.current,
      });
    }

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      useGameStore.getState().clearBoss();
      useGameStore.getState().setCheckpoint({
        x: 0,
        y: 2,
        z: -68,
        label: "Warden Plaza",
      });
      useGameStore
        .getState()
        .setObjective("Aegis Warden down — enter Biolume Vaults");
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.7);
      return;
    }

    if (!engaged.current) return;

    const nextPhase = hp.current > 330 ? 1 : hp.current > 160 ? 2 : 3;
    if (nextPhase !== phase.current) {
      phase.current = nextPhase;
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.5);
      useGameStore
        .getState()
        .setObjective(`Aegis Warden — Phase ${phase.current}`);
    }

    const t = state.clock.elapsedTime;
    mesh.position.y = 2.5 + Math.sin(t * 1.2) * 0.4;
    mesh.rotation.y += dt * (0.4 + phase.current * 0.25);

    cooldown.current = Math.max(0, cooldown.current - dt);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const muzzle = worldPos(mesh).clone().add(new THREE.Vector3(0, 1.2, 0));
    const color =
      phase.current === 1
        ? "#94a3b8"
        : phase.current === 2
          ? "#a78bfa"
          : "#f87171";

    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      if (Math.random() < dt * 10) {
        combatFx.pushBeam(muzzle, cam.clone(), "#ffe066", 0.05);
      }
      mat.emissiveIntensity = 1.4 + Math.sin(t * 18) * 0.5;
      if (windup.current <= 0) {
        const interval =
          phase.current === 1 ? 2.0 : phase.current === 2 ? 1.5 : 1.1;
        cooldown.current = interval;
        useGameStore.getState().damagePlayer(5 + phase.current * 2);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.38);
        combatFx.pushBeam(muzzle, cam.clone(), color, 0.16);
        combatFx.pushImpact(cam.clone(), color);
        useFxStore.getState().pulseShake(0.08, 140);
        if (phase.current === 3 && dist < 10) {
          useGameStore.getState().damagePlayer(6);
        }
      }
    } else if (dist < 26 && cooldown.current <= 0) {
      windup.current = 0.48;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.22);
    }

    if (windup.current <= 0) {
      mat.emissive = new THREE.Color(
        phase.current === 1
          ? "#334155"
          : phase.current === 2
            ? "#7c3aed"
            : "#dc2626",
      );
      mat.emissiveIntensity = 0.6 + phase.current * 0.35;
    }
  });

  return (
    <group position={[0, 0, -70]}>
      <mesh
        ref={bodyRef}
        position={[0, 2.5, 0]}
        castShadow
        userData={{ destructible: true, hp: 500, kind: "boss_aegis" }}
      >
        <dodecahedronGeometry args={[2.2, 0]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.85}
          roughness={0.2}
          emissive="#334155"
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[10, 11, 48]} />
        <meshStandardMaterial
          color="#2ee6c8"
          emissive="#2ee6c8"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Warden plaza cover — shootable sightlines */}
      {[
        [-7, 1.2, -4],
        [7, 1.2, -4],
        [-9, 1.2, 5],
        [9, 1.2, 5],
      ].map((p, i) => (
        <mesh key={`ac-${i}`} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[2.4, 2.4, 1.4]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.65}
            roughness={0.35}
            emissive="#1e293b"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}
