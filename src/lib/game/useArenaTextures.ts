"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function prep(
  textures: THREE.Texture[],
  colorIndex: number,
  repeat: number,
) {
  textures.forEach((t, i) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.repeat.set(repeat, repeat);
    t.colorSpace =
      i === colorIndex ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
  });
}

/** Shared PBR maps — Poly Haven + AmbientCG (CC0). */
export function useMetalPlateMaps(repeat = 24) {
  const [map, normalMap, roughnessMap, metalnessMap] = useTexture([
    "/assets/textures/polyhaven/metal_plate/diff.jpg",
    "/assets/textures/polyhaven/metal_plate/nor.jpg",
    "/assets/textures/polyhaven/metal_plate/rough.jpg",
    "/assets/textures/polyhaven/metal_plate/metal.jpg",
  ]);
  prep([map, normalMap, roughnessMap, metalnessMap], 0, repeat);
  return { map, normalMap, roughnessMap, metalnessMap };
}

export function useConcreteMaps(repeat = 18) {
  const [map, normalMap, roughnessMap] = useTexture([
    "/assets/textures/ambientcg/concrete034/color.jpg",
    "/assets/textures/ambientcg/concrete034/normal.jpg",
    "/assets/textures/ambientcg/concrete034/rough.jpg",
  ]);
  prep([map, normalMap, roughnessMap], 0, repeat);
  return { map, normalMap, roughnessMap };
}

export function useRustMaps(repeat = 8) {
  const [map, normalMap, roughnessMap, metalnessMap] = useTexture([
    "/assets/textures/ambientcg/rust005/color.jpg",
    "/assets/textures/ambientcg/rust005/normal.jpg",
    "/assets/textures/ambientcg/rust005/rough.jpg",
    "/assets/textures/ambientcg/rust005/metal.jpg",
  ]);
  prep([map, normalMap, roughnessMap, metalnessMap], 0, repeat);
  return { map, normalMap, roughnessMap, metalnessMap };
}

export function useAsphaltMaps(repeat = 14) {
  const [map, normalMap, roughnessMap] = useTexture([
    "/assets/textures/polyhaven/asphalt/diff.jpg",
    "/assets/textures/polyhaven/asphalt/nor.jpg",
    "/assets/textures/polyhaven/asphalt/rough.jpg",
  ]);
  prep([map, normalMap, roughnessMap], 0, repeat);
  return { map, normalMap, roughnessMap };
}

export function useTilesMaps(repeat = 4) {
  const [map, normalMap, roughnessMap] = useTexture([
    "/assets/textures/ambientcg/tiles075/color.jpg",
    "/assets/textures/ambientcg/tiles075/normal.jpg",
    "/assets/textures/ambientcg/tiles075/rough.jpg",
  ]);
  prep([map, normalMap, roughnessMap], 0, repeat);
  return { map, normalMap, roughnessMap };
}

export function useMetalGrateMaps(repeat = 8) {
  const [map, normalMap, roughnessMap, metalnessMap] = useTexture([
    "/assets/textures/polyhaven/metal_grate/diff.jpg",
    "/assets/textures/polyhaven/metal_grate/nor.jpg",
    "/assets/textures/polyhaven/metal_grate/rough.jpg",
    "/assets/textures/polyhaven/metal_grate/metal.jpg",
  ]);
  prep([map, normalMap, roughnessMap, metalnessMap], 0, repeat);
  return { map, normalMap, roughnessMap, metalnessMap };
}

/** Diffuse-only — looks textured without PBR shader cost (Low-safe). */
export function useHangarDiffuseMaps() {
  const [floor, wall, metal, grate] = useTexture([
    "/assets/textures/polyhaven/concrete_floor/diff.jpg",
    "/assets/textures/polyhaven/plaster_wall/diff.jpg",
    "/assets/textures/polyhaven/metal_plate_02/diff.jpg",
    "/assets/textures/polyhaven/metal_grate/diff.jpg",
  ]);
  prep([floor, wall, metal, grate], 0, 1);
  floor.repeat.set(12, 12);
  wall.repeat.set(6, 3);
  metal.repeat.set(2, 2);
  grate.repeat.set(8, 20);
  for (const t of [floor, wall, metal, grate]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
  }
  return { floor, wall, metal, grate };
}

export function usePaintedMetalDiffuse(repeat = 2) {
  const [map] = useTexture([
    "/assets/textures/ambientcg/painted_metal004/color.jpg",
  ]);
  prep([map], 0, repeat);
  return { map };
}
