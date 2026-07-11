"use client";

import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { worldPos } from "@/lib/game/math";

function Box({
  position,
  size,
  color,
  emissive,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.15}
          emissive={emissive ?? "#000"}
          emissiveIntensity={emissive ? 0.6 : 0}
        />
      </mesh>
    </RigidBody>
  );
}

function NestNode({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(60);
  const dead = useRef(false);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;
    mesh.rotation.y += 0.01;
    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      useGameStore.getState().setObjective("Nest destroyed — climb the vault shaft");
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.55);
      combatFx.pushBoom(worldPos(mesh), "#86efac", 4);
      useFxStore.getState().pulseShake(0.14, 220);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      userData={{ destructible: true, hp: 60, kind: "nest" }}
    >
      <icosahedronGeometry args={[1.1, 0]} />
      <meshStandardMaterial
        color="#86efac"
        emissive="#16a34a"
        emissiveIntensity={1.2}
      />
    </mesh>
  );
}

/** Biolume Vaults — overgrown vertical interior past Rust Canyons. */
export function BiolumeVaults() {
  return (
    <group position={[0, 0, -95]}>
      {/* Chamber floor */}
      <Box position={[0, 0.2, 0]} size={[28, 0.4, 28]} color="#1a2e24" />
      {/* Walls */}
      <Box position={[-14, 6, 0]} size={[1.5, 12, 28]} color="#24352c" emissive="#0d2818" />
      <Box position={[14, 6, 0]} size={[1.5, 12, 28]} color="#24352c" emissive="#0d2818" />
      <Box position={[0, 6, -14]} size={[28, 12, 1.5]} color="#24352c" emissive="#0d2818" />
      {/* Vertical climb */}
      <Box position={[-6, 2, -4]} size={[3, 0.35, 3]} color="#4ade80" emissive="#166534" />
      <Box position={[0, 4.5, -6]} size={[3, 0.35, 3]} color="#4ade80" emissive="#166534" />
      <Box position={[6, 7, -4]} size={[3, 0.35, 3]} color="#4ade80" emissive="#166534" />
      <Box position={[2, 9.5, 2]} size={[4, 0.35, 4]} color="#86efac" emissive="#166534" />
      <Box position={[-4, 12, 4]} size={[3, 0.35, 3]} color="#4ade80" emissive="#166534" />
      <Box position={[0, 14.5, 0]} size={[6, 0.4, 6]} color="#bbf7d0" emissive="#15803d" />
      {/* Biolume pillars */}
      {[
        [-10, 3, 8],
        [10, 3, 8],
        [-8, 3, -8],
        [8, 3, -8],
        [0, 4, 10],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.4, 0.55, i === 4 ? 8 : 6, 8]} />
          <meshStandardMaterial
            color="#5eead4"
            emissive="#14b8a6"
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}
      {/* Climb path markers — readable vertical route */}
      {[2, 4.5, 7, 9.5, 12, 14.5].map((y) => (
        <mesh
          key={`climb-${y}`}
          position={[0, y, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.4, 0.65, 3, 1, 0, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#86efac"
            emissive="#4ade80"
            emissiveIntensity={1.1}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}
      <NestNode position={[0, 1.4, 0]} />
      <pointLight position={[0, 8, 0]} intensity={2.4} color="#4ade80" distance={34} />
      <pointLight position={[-6, 12, 2]} intensity={1.4} color="#86efac" distance={20} />
      <pointLight position={[6, 10, -2]} intensity={1.4} color="#86efac" distance={20} />
    </group>
  );
}
