"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, type WeaponId } from "@/stores/gameStore";

const COLORS: Record<WeaponId, string> = {
  pulse_smg: "#7dffef",
  scatter_carbine: "#ffb347",
  arc_caster: "#60a5fa",
  rail_lance: "#e879f9",
  void_launcher: "#c084fc",
};

/** Simple FPS viewmodel bob + weapon body. */
export function WeaponViewmodel() {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const active = useGameStore((s) => s.activeWeapon);
  const screen = useGameStore((s) => s.screen);
  const bob = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || screen !== "playing") return;
    bob.current += dt * 8;
    const y = -0.28 + Math.sin(bob.current) * 0.012;
    const x = 0.28 + Math.cos(bob.current * 0.5) * 0.006;
    g.position.set(x, y, -0.55);
    g.rotation.set(0.05, 0.15, 0.02);
    camera.add(g);
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.1, 0.42]} />
        <meshStandardMaterial
          color="#2a2f3a"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.02, -0.28]}>
        <boxGeometry args={[0.05, 0.05, 0.2]} />
        <meshStandardMaterial
          color={COLORS[active]}
          emissive={COLORS[active]}
          emissiveIntensity={0.9}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0.02, -0.08, 0.05]}>
        <boxGeometry args={[0.04, 0.12, 0.08]} />
        <meshStandardMaterial color="#1a1f28" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}
