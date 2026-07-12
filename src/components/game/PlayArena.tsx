"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import {
  useHangarDiffuseMaps,
  usePaintedMetalDiffuse,
} from "@/lib/game/useArenaTextures";
import { useTexture } from "@react-three/drei";

/**
 * Lean hangar dressed with free CC0 textures + a few real props.
 * One RigidBody for collision; visuals use diffuse maps (Low-safe).
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

      <Suspense fallback={null}>
        <TexturedArenaVisuals />
        <SkyDome />
      </Suspense>

      <Suspense fallback={null}>
        <ArenaProps />
      </Suspense>

      <HealPad position={[4, 0.35, 6]} />
    </group>
  );
}

function SkyDome() {
  const map = useTexture("/assets/env/industrial_sunset_2k.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh scale={[-1, 1, 1]} userData={{ skipHit: true }}>
      <sphereGeometry args={[95, 24, 16]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

function LiteArenaVisuals() {
  return (
    <group>
      <mesh position={[0, -0.5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 1, 80]} />
        <meshBasicMaterial color="#5c6670" />
      </mesh>
    </group>
  );
}

function TexturedArenaVisuals() {
  const { floor, wall, metal, grate } = useHangarDiffuseMaps();
  const painted = usePaintedMetalDiffuse(1.5);

  return (
    <group>
      {/* Poly Haven painted concrete floor */}
      <mesh position={[0, -0.5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 1, 80]} />
        <meshBasicMaterial map={floor} color="#c8c4be" />
      </mesh>
      {/* Spawn pad — AmbientCG painted metal */}
      <mesh position={[0, 0.06, 8]} userData={{ skipHit: true }}>
        <boxGeometry args={[12, 0.3, 12]} />
        <meshBasicMaterial map={painted.map} color="#d0d5dc" />
      </mesh>
      {/* Metal grate runway */}
      <mesh position={[0, 0.09, -10]} userData={{ skipHit: true }}>
        <boxGeometry args={[3.2, 0.06, 48]} />
        <meshBasicMaterial map={grate} color="#b0b6bc" />
      </mesh>
      {/* Orange lane accent */}
      <mesh
        position={[0, 0.12, -10]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ skipHit: true }}
      >
        <planeGeometry args={[0.55, 48]} />
        <meshBasicMaterial color="#ff7a18" transparent opacity={0.75} />
      </mesh>

      {/* Cover crates — metal plate */}
      <mesh position={[-6, 1.2, -6]} userData={{ skipHit: true }}>
        <boxGeometry args={[4, 2.4, 2.4]} />
        <meshBasicMaterial map={metal} color="#9a8a78" />
      </mesh>
      <mesh position={[6, 1.2, -10]} userData={{ skipHit: true }}>
        <boxGeometry args={[4, 2.4, 2.4]} />
        <meshBasicMaterial map={metal} color="#7a8590" />
      </mesh>
      <mesh position={[0, 1.4, -22]} userData={{ skipHit: true }}>
        <boxGeometry args={[6, 2.8, 2.4]} />
        <meshBasicMaterial map={metal} color="#8a9098" />
      </mesh>

      {/* Perimeter walls — plaster */}
      <mesh position={[0, 5, 28]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 12, 1.2]} />
        <meshBasicMaterial map={wall} color="#6a7580" />
      </mesh>
      <mesh position={[0, 5, -52]} userData={{ skipHit: true }}>
        <boxGeometry args={[80, 12, 1.2]} />
        <meshBasicMaterial map={wall} color="#6a7580" />
      </mesh>
      <mesh position={[-40, 5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[1.2, 12, 80]} />
        <meshBasicMaterial map={wall} color="#5a6570" />
      </mesh>
      <mesh position={[40, 5, -12]} userData={{ skipHit: true }}>
        <boxGeometry args={[1.2, 12, 80]} />
        <meshBasicMaterial map={wall} color="#5a6570" />
      </mesh>
    </group>
  );
}

function StationProp({
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  url: string;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = false;
        m.receiveShadow = false;
        m.userData.skipHit = true;
      }
    });
    return c;
  }, [scene]);
  return (
    <primitive
      object={cloned}
      position={position}
      scale={scale}
      rotation={rotation}
      userData={{ skipHit: true }}
    />
  );
}

/** Curated free props — Kenney Station + Poly Haven (few pieces). */
function ArenaProps() {
  return (
    <group>
      <StationProp
        url="/assets/models/kenney-station/computer-wide.glb"
        position={[-8, 0, 5]}
        scale={2.0}
        rotation={[0, 0.7, 0]}
      />
      <StationProp
        url="/assets/models/kenney-station/table-display.glb"
        position={[8, 0, 4]}
        scale={1.8}
        rotation={[0, -0.5, 0]}
      />
      <StationProp
        url="/assets/models/kenney-station/structure-barrier.glb"
        position={[-10, 0, -14]}
        scale={2.2}
      />
      <StationProp
        url="/assets/models/kenney-station/container-wide.glb"
        position={[11, 0, -16]}
        scale={2.0}
        rotation={[0, 0.3, 0]}
      />
      <StationProp
        url="/assets/models/kenney-blaster/crate-wide.glb"
        position={[-4, 0.4, -4]}
        scale={1.5}
      />
      <StationProp
        url="/assets/models/polyhaven/plastic_crate_01/plastic_crate_01_1k.gltf"
        position={[5, 0, -8]}
        scale={1.2}
        rotation={[0, 0.4, 0]}
      />
      <StationProp
        url="/assets/models/polyhaven/power_box_01/power_box_01_1k.gltf"
        position={[-12, 0, -8]}
        scale={1.15}
        rotation={[0, 1.1, 0]}
      />
      <StationProp
        url="/assets/models/polyhaven/old_military_crate/old_military_crate_1k.gltf"
        position={[9, 0, -24]}
        scale={1.1}
      />
      <StationProp
        url="/assets/models/polyhaven/cardboard_box_01/cardboard_box_01_1k.gltf"
        position={[-7, 0, -26]}
        scale={1.3}
        rotation={[0, -0.6, 0]}
      />
      <StationProp
        url="/assets/models/kenney-station/wall-window.glb"
        position={[-38.5, 2, -20]}
        scale={3.2}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-station/computer-wide.glb");
useGLTF.preload("/assets/models/kenney-station/structure-barrier.glb");
useGLTF.preload("/assets/models/kenney-blaster/crate-wide.glb");

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
