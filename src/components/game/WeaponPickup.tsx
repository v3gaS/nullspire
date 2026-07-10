"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { WEAPON_META } from "@/lib/game/constants";

export function WeaponPickup({
  id,
  position,
}: {
  id: WeaponId;
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const taken = useRef(false);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || taken.current) return;
    mesh.rotation.y += 0.02;
    mesh.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15;

    const dist = state.camera.position.distanceTo(mesh.position);
    if (dist < 1.8) {
      const s = useGameStore.getState();
      if (!s.weapons[id].unlocked) {
        useGameStore.setState({
          weapons: {
            ...s.weapons,
            [id]: { ...s.weapons[id], unlocked: true },
          },
          activeWeapon: id,
          objective: `Acquired ${WEAPON_META[id].name}`,
        });
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.5);
      }
      taken.current = true;
      mesh.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[0.5, 0.35, 1.1]} />
      <meshStandardMaterial
        color="#ffb347"
        emissive="#ff7a18"
        emissiveIntensity={0.8}
        metalness={0.6}
        roughness={0.3}
      />
    </mesh>
  );
}
