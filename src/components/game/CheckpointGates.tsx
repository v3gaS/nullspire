"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";

const GATES: {
  pos: [number, number, number];
  label: string;
  objective: string;
}[] = [
  {
    pos: [0, 0.4, -25],
    label: "Canyon Gate",
    objective: "Rust Canyons open — push to the Warden plaza",
  },
  {
    pos: [0, 0.4, -88],
    label: "Vault Gate",
    objective: "Biolume Vaults — destroy the nest, climb the shaft",
  },
  {
    pos: [0, 0.4, -118],
    label: "Core Gate",
    objective: "Null Core ahead — Primarch awaits",
  },
];

export function CheckpointGates() {
  const claimed = useRef<Record<string, boolean>>({});

  return (
    <group>
      {GATES.map((g) => (
        <Gate key={g.label} {...g} claimed={claimed} />
      ))}
    </group>
  );
}

function Gate({
  pos,
  label,
  objective,
  claimed,
}: {
  pos: [number, number, number];
  label: string;
  objective: string;
  claimed: MutableRefObject<Record<string, boolean>>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (claimed.current[label]) {
      mesh.rotation.y += 0.004;
      return;
    }
    mesh.rotation.y += 0.01;
    const pulse = 1.2 + Math.sin(state.clock.elapsedTime * 2.5) * 0.5;
    (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    if (state.camera.position.distanceTo(mesh.position) < 3.2) {
      claimed.current[label] = true;
      useGameStore.getState().setCheckpoint({
        x: pos[0],
        y: pos[1] + 1.5,
        z: pos[2],
        label,
      });
      useGameStore.getState().setObjective(objective);
      useGameStore.getState().healPlayer(20);
      useGameStore.getState().setArmor(
        Math.min(100, useGameStore.getState().armor + 15),
      );
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
      combatFx.pushBoom(new THREE.Vector3(...pos), "#67e8f9", 4.0);
      combatFx.pushImpact(new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2]), "#a5f3fc");
      useFxStore.getState().pulseShake(0.12, 220);
      mesh.scale.setScalar(0.5);
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={pos}>
        <torusGeometry args={[1.6, 0.12, 8, 32]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={1.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[pos[0], 0.05, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.9, 28]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#22d3ee"
          emissiveIntensity={1.1}
          transparent
          opacity={0.65}
        />
      </mesh>
      <pointLight position={pos} color="#67e8f9" intensity={1.8} distance={10} />
    </group>
  );
}
