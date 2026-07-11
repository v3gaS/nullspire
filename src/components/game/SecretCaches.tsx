"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LootDrop } from "@/components/game/EliteAndLoot";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";

const SECRETS: {
  position: [number, number, number];
  kind: "health" | "ammo" | "shards";
  hint: string;
  radius: number;
}[] = [
  {
    position: [-16, 1.2, -8],
    kind: "ammo",
    hint: "Secret cache — Crash Rim alcove",
    radius: 4.5,
  },
  {
    position: [11, 5.5, -15],
    kind: "shards",
    hint: "Secret — high ledge Null stash",
    radius: 5,
  },
  {
    position: [-9, 0.8, -40],
    kind: "health",
    hint: "Secret — canyon undercroft medkit",
    radius: 4,
  },
  {
    position: [16, 1.2, -66],
    kind: "ammo",
    hint: "Secret — vault approach ammo dump",
    radius: 5,
  },
];

function SecretHint({
  position,
  hint,
  radius,
}: {
  position: [number, number, number];
  hint: string;
  radius: number;
}) {
  const shown = useRef(false);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (shown.current) return;
    const dist = state.camera.position.distanceTo(
      new THREE.Vector3(...position),
    );
    if (light.current) {
      light.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.4;
    }
    if (dist < radius) {
      shown.current = true;
      useGameStore.getState().setObjective(hint);
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.25);
    }
  });

  return (
    <pointLight
      ref={light}
      position={[position[0], position[1] + 0.8, position[2]]}
      color="#fbbf24"
      intensity={0.8}
      distance={6}
    />
  );
}

/**
 * Modern twist on classic secret hunting — glowing alcove caches off the main line.
 */
export function SecretCaches() {
  return (
    <group>
      {SECRETS.map((s) => (
        <group key={s.hint}>
          <SecretHint
            position={s.position}
            hint={s.hint}
            radius={s.radius}
          />
          <LootDrop position={s.position} kind={s.kind} />
          {/* Subtle floor marker for searchers */}
          <mesh
            position={[s.position[0], 0.04, s.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.35, 0.55, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.8}
              transparent
              opacity={0.55}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
