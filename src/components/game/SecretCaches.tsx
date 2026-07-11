"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LootDrop } from "@/components/game/EliteAndLoot";
import { combatFx } from "@/components/game/CombatVfx";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { useFxStore } from "@/stores/fxStore";

const SECRETS: {
  position: [number, number, number];
  kind: "health" | "ammo" | "shards";
  hint: string;
  radius: number;
}[] = [
  {
    position: [-16, 1.2, -8],
    kind: "ammo",
    hint: "Crash Rim alcove",
    radius: 4.5,
  },
  {
    position: [11, 5.5, -15],
    kind: "shards",
    hint: "high ledge Null stash",
    radius: 5,
  },
  {
    position: [15, 0.8, -12],
    kind: "ammo",
    hint: "barrel yard side cache",
    radius: 4,
  },
  {
    position: [-9, 0.8, -40],
    kind: "health",
    hint: "canyon undercroft medkit",
    radius: 4,
  },
  {
    position: [-14, 2.2, -48],
    kind: "shards",
    hint: "rust trench overlook",
    radius: 4.5,
  },
  {
    position: [16, 1.2, -66],
    kind: "ammo",
    hint: "vault approach ammo dump",
    radius: 5,
  },
  {
    position: [-10, 2.5, -92],
    kind: "health",
    hint: "Biolume side alcove",
    radius: 4.5,
  },
  {
    position: [8, 15.5, -95],
    kind: "shards",
    hint: "vault shaft high cache",
    radius: 5,
  },
  {
    position: [-12, 1.0, -125],
    kind: "ammo",
    hint: "Primarch antechamber stash",
    radius: 4.5,
  },
  {
    position: [11, 1.0, -128],
    kind: "health",
    hint: "Core ring medkit",
    radius: 4.5,
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
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (shown.current) return;
    const dist = state.camera.position.distanceTo(
      new THREE.Vector3(...position),
    );
    const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.4;
    if (light.current) {
      light.current.intensity = pulse;
      light.current.position.y =
        position[1] + 0.8 + Math.sin(state.clock.elapsedTime * 2.2) * 0.25;
    }
    if (ring.current) {
      ring.current.rotation.z = state.clock.elapsedTime * 0.8;
      ring.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.08);
    }
    if (dist < radius) {
      shown.current = true;
      useGameStore.getState().setObjective(`SECRET FOUND — ${hint}`);
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.55);
      useFxStore.getState().pulseShake(0.1, 200);
      combatFx.pushBoom(
        new THREE.Vector3(...position),
        "#fbbf24",
        2.2,
      );
    }
  });

  return (
    <>
      <pointLight
        ref={light}
        position={[position[0], position[1] + 0.8, position[2]]}
        color="#fbbf24"
        intensity={1.4}
        distance={7}
      />
      <mesh
        ref={ring}
        position={[position[0], 0.04, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.35, 0.55, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
    </>
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
        </group>
      ))}
    </group>
  );
}
