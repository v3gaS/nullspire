"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { useFxStore } from "@/stores/fxStore";

/** Pulsing energy grid strip — step on it and get zapped. */
export function EnergyGrid({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cooldown = useRef(0);

  useFrame((state, dt) => {
    cooldown.current = Math.max(0, cooldown.current - dt);
    const mesh = meshRef.current;
    if (!mesh || useGameStore.getState().screen !== "playing") return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.15 + Math.sin(state.clock.elapsedTime * 9) * 0.55;
    const cam = state.camera.position;
    if (
      Math.abs(cam.x - position[0]) < size[0] / 2 &&
      Math.abs(cam.z - position[2]) < size[1] / 2 &&
      cam.y < position[1] + 2.4 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      cooldown.current = 0.45;
      useGameStore.getState().damagePlayer(5);
      playSfx("/assets/audio/kenney-fps/enemy_hurt.ogg", 0.26);
      combatFx.pushImpact(cam.clone(), "#38bdf8");
      combatFx.pushBoom(cam.clone().add(new THREE.Vector3(0, -0.4, 0)), "#38bdf8", 1.2);
      useFxStore.getState().pulseShake(0.07, 110);
      mat.emissiveIntensity = 2.8;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[size[0], size[1]]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={1.35}
          transparent
          opacity={0.62}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[position[0], position[1] + 0.02, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[
            Math.max(size[0], size[1]) * 0.35,
            Math.max(size[0], size[1]) * 0.48,
            20,
          ]}
        />
        <meshStandardMaterial
          color="#7dd3fc"
          emissive="#38bdf8"
          emissiveIntensity={1.3}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Warning rim — Quake hazard readability */}
      <mesh
        position={[position[0], position[1] + 0.04, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[
            Math.max(size[0], size[1]) * 0.52,
            Math.max(size[0], size[1]) * 0.58,
            24,
          ]}
        />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.4}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
