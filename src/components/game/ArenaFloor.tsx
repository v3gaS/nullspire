"use client";

import { useAsphaltMaps, useMetalGrateMaps, useTilesMaps } from "@/lib/game/useArenaTextures";
import { useSettingsStore } from "@/stores/settingsStore";

/** Plain floor for Low — no PBR texture upload (was freezing Macs). */
function LiteFloor() {
  return (
    <>
      <mesh position={[0, -0.5, 0]} receiveShadow={false} userData={{ skipHit: true }}>
        <boxGeometry args={[180, 1, 180]} />
        <meshBasicMaterial color="#6a717a" />
      </mesh>
      <mesh position={[0, 0.05, 8]} receiveShadow={false} userData={{ skipHit: true }}>
        <boxGeometry args={[16, 0.35, 16]} />
        <meshBasicMaterial color="#8a949e" />
      </mesh>
      <mesh position={[0, 0.08, -8]} receiveShadow={false} userData={{ skipHit: true }}>
        <boxGeometry args={[3.5, 0.08, 48]} />
        <meshBasicMaterial color="#5a636c" />
      </mesh>
    </>
  );
}

function PbrFloor() {
  const asphalt = useAsphaltMaps(16);
  const tiles = useTilesMaps(3);
  const grate = useMetalGrateMaps(10);

  return (
    <>
      <mesh position={[0, -0.5, 0]} receiveShadow userData={{ skipHit: true }}>
        <boxGeometry args={[180, 1, 180]} />
        <meshStandardMaterial
          map={asphalt.map}
          normalMap={asphalt.normalMap}
          roughnessMap={asphalt.roughnessMap}
          roughness={1}
          metalness={0.05}
          color="#b8b4ae"
        />
      </mesh>
      <mesh position={[0, 0.05, 8]} receiveShadow userData={{ skipHit: true }}>
        <boxGeometry args={[16, 0.35, 16]} />
        <meshStandardMaterial
          map={tiles.map}
          normalMap={tiles.normalMap}
          roughnessMap={tiles.roughnessMap}
          roughness={0.85}
          metalness={0.15}
          color="#d8dce2"
          emissive="#2ee6c8"
          emissiveIntensity={0.08}
        />
      </mesh>
      <mesh position={[0, 0.08, -8]} receiveShadow userData={{ skipHit: true }}>
        <boxGeometry args={[4.5, 0.08, 48]} />
        <meshStandardMaterial
          map={grate.map}
          normalMap={grate.normalMap}
          roughnessMap={grate.roughnessMap}
          metalnessMap={grate.metalnessMap}
          roughness={0.55}
          metalness={0.9}
          color="#c4c8ce"
        />
      </mesh>
    </>
  );
}

/** Textured hangar floor — PBR only when quality allows. */
export function ArenaFloor() {
  const pbr = useSettingsStore((s) => s.quality !== "low");
  return pbr ? <PbrFloor /> : <LiteFloor />;
}
