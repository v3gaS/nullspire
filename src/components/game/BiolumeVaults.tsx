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
      combatFx.pushBoom(worldPos(mesh), "#86efac", 5.2);
      combatFx.pushBoom(worldPos(mesh).clone().add(new THREE.Vector3(0, 1, 0)), "#4ade80", 2.8);
      useFxStore.getState().pulseShake(0.18, 280);
      useFxStore.getState().pulseKill("Nest");
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
      {/* Floor chevrons toward climb shaft */}
      {[4, 1, -2, -5].map((z) => (
        <mesh
          key={`vchev-${z}`}
          position={[0, 0.42, z]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
        >
          <ringGeometry args={[0.45, 0.7, 3, 1, Math.PI / 6, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#86efac"
            emissive="#4ade80"
            emissiveIntensity={1.0}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {/* Walls */}
      <Box position={[-14, 6, 0]} size={[1.5, 12, 28]} color="#24352c" emissive="#0d2818" />
      <Box position={[14, 6, 0]} size={[1.5, 12, 28]} color="#24352c" emissive="#0d2818" />
      <Box position={[0, 6, -14]} size={[28, 12, 1.5]} color="#24352c" emissive="#0d2818" />
      {/* Vertical climb — hangar-grey pads + green biolume edge */}
      <Box position={[-6, 2, -4]} size={[3, 0.35, 3]} color="#6a7580" emissive="#3a4550" />
      <Box position={[0, 4.5, -6]} size={[3, 0.35, 3]} color="#7a8590" emissive="#3a4550" />
      <Box position={[6, 7, -4]} size={[3, 0.35, 3]} color="#6a7580" emissive="#3a4550" />
      <Box position={[2, 9.5, 2]} size={[4, 0.35, 4]} color="#8a9098" emissive="#4a5560" />
      <Box position={[-4, 12, 4]} size={[3, 0.35, 3]} color="#6a7580" emissive="#3a4550" />
      <Box position={[0, 14.5, 0]} size={[6, 0.4, 6]} color="#8a9098" emissive="#4ade80" />
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
            emissiveIntensity={1.55}
          />
        </mesh>
      ))}
      {/* Climb path markers — orange Quake chevrons up the shaft */}
      {[2, 4.5, 7, 9.5, 12, 14.5].map((y) => (
        <mesh
          key={`climb-${y}`}
          position={[0, y, -5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.45, 0.72, 3, 1, 0, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#ffb347"
            emissive="#ff7a18"
            emissiveIntensity={1.25}
            transparent
            opacity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
      <NestNode position={[0, 1.4, 0]} />
      <pointLight position={[0, 8, 0]} intensity={2.8} color="#4ade80" distance={36} />
      <pointLight position={[-6, 12, 2]} intensity={1.8} color="#86efac" distance={22} />
      <pointLight position={[6, 10, -2]} intensity={1.8} color="#86efac" distance={22} />
      <pointLight position={[0, 16, 0]} intensity={2.0} color="#bbf7d0" distance={24} />
    </group>
  );
}
