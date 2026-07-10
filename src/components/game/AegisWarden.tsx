"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";

/** Sector 1 boss — Aegis Warden with 3 phases. */
export function AegisWarden() {
  const bodyRef = useRef<THREE.Mesh>(null);
  const hp = useRef(500);
  const dead = useRef(false);
  const phase = useRef(1);
  const cooldown = useRef(0);
  const addCooldown = useRef(0);

  useFrame((state, dt) => {
    const mesh = bodyRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      useGameStore.getState().setScreen("victory");
      useGameStore
        .getState()
        .setObjective("Aegis Warden down — Nullspire yields… for now");
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.7);
      return;
    }

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

    const cam = state.camera.position;
    const dist = cam.distanceTo(mesh.position);
    cooldown.current = Math.max(0, cooldown.current - dt);
    addCooldown.current = Math.max(0, addCooldown.current - dt);

    if (dist < 45 && cooldown.current <= 0) {
      const interval = phase.current === 1 ? 1.5 : phase.current === 2 ? 1.1 : 0.75;
      cooldown.current = interval;
      const dmg = 8 + phase.current * 4;
      useGameStore.getState().damagePlayer(dmg);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.3);
      // Slam telegraph in phase 3
      if (phase.current === 3 && dist < 12) {
        useGameStore.getState().damagePlayer(10);
      }
    }

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissive = new THREE.Color(
      phase.current === 1 ? "#334155" : phase.current === 2 ? "#7c3aed" : "#dc2626",
    );
    mat.emissiveIntensity = 0.6 + phase.current * 0.35;
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
      {/* Arena ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[10, 11, 48]} />
        <meshStandardMaterial
          color="#2ee6c8"
          emissive="#2ee6c8"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}
