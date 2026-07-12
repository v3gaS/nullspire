"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";

/**
 * Lean hangar — one fixed RigidBody, few colliders, decoration without physics.
 * Replaces CrashRimSector's ~70 individual RigidBodies.
 */
export function PlayArena() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
        <CuboidCollider args={[40, 1, 40]} position={[0, -1, -12]} />
        <CuboidCollider args={[6, 0.25, 6]} position={[0, 0.05, 8]} />
        <CuboidCollider args={[40, 6, 0.6]} position={[0, 5, 28]} />
        <CuboidCollider args={[40, 6, 0.6]} position={[0, 5, -52]} />
        <CuboidCollider args={[0.6, 6, 40]} position={[-40, 5, -12]} />
        <CuboidCollider args={[0.6, 6, 40]} position={[40, 5, -12]} />
        <CuboidCollider args={[2, 1.2, 1.2]} position={[-6, 1.2, -6]} />
        <CuboidCollider args={[2, 1.2, 1.2]} position={[6, 1.2, -10]} />
        <CuboidCollider args={[3, 1.4, 1.2]} position={[0, 1.4, -22]} />
      </RigidBody>

      <mesh position={[0, -0.5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 1, 80]} />
        <meshBasicMaterial color="#5c6670" />
      </mesh>
      <mesh position={[0, 0.06, 8]} userData={{ skipHit: true }}>
        <boxGeometry args={[12, 0.3, 12]} />
        <meshBasicMaterial color="#7a8794" />
      </mesh>
      <mesh
        position={[0, 0.08, -10]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ skipHit: true }}
      >
        <planeGeometry args={[1.4, 48]} />
        <meshBasicMaterial color="#ff7a18" transparent opacity={0.55} />
      </mesh>

      <mesh position={[-6, 1.2, -6]} userData={{ skipHit: true }}>
        <boxGeometry args={[4, 2.4, 2.4]} />
        <meshBasicMaterial color="#8a7a68" />
      </mesh>
      <mesh position={[6, 1.2, -10]} userData={{ skipHit: true }}>
        <boxGeometry args={[4, 2.4, 2.4]} />
        <meshBasicMaterial color="#6a7580" />
      </mesh>
      <mesh position={[0, 1.4, -22]} userData={{ skipHit: true }}>
        <boxGeometry args={[6, 2.8, 2.4]} />
        <meshBasicMaterial color="#7a8590" />
      </mesh>

      <mesh position={[0, 5, 28]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 12, 1.2]} />
        <meshBasicMaterial color="#4a5560" />
      </mesh>
      <mesh position={[0, 5, -52]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 12, 1.2]} />
        <meshBasicMaterial color="#4a5560" />
      </mesh>
      <mesh position={[-40, 5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[1.2, 12, 80]} />
        <meshBasicMaterial color="#3f4a54" />
      </mesh>
      <mesh position={[40, 5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[1.2, 12, 80]} />
        <meshBasicMaterial color="#3f4a54" />
      </mesh>

      <HealPad position={[4, 0.35, 6]} />
    </group>
  );
}

function HealPad({ position }: { position: [number, number, number] }) {
  const cool = useRef(0);

  useFrame((state, dt) => {
    cool.current = Math.max(0, cool.current - dt);
    if (cool.current > 0) return;
    if (useGameStore.getState().screen !== "playing") return;
    const cam = state.camera.position;
    const dx = cam.x - position[0];
    const dz = cam.z - position[2];
    if (dx * dx + dz * dz > 2.2 * 2.2) return;
    const g = useGameStore.getState();
    if (g.health >= 100 && g.armor >= 100) return;
    cool.current = 1.2;
    g.healPlayer(18);
    g.setArmor(Math.min(100, g.armor + 10));
    playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.2);
  });

  return (
    <mesh position={position} userData={{ skipHit: true }}>
      <cylinderGeometry args={[1.2, 1.2, 0.25, 16]} />
      <meshBasicMaterial color="#4ade80" transparent opacity={0.7} />
    </mesh>
  );
}
