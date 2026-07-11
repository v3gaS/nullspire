"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DistanceCull } from "./DistanceCull";

function StationProp({
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  url: string;
  position: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
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

/**
 * Curated Space Station Kit props — fewer pieces, real models, clearer silhouette.
 * CC0 Kenney Space Station Kit.
 */
export function WorldDressing() {
  return (
    <group>
      {/* Drop Zone — readable set dressing, not clutter */}
      <DistanceCull anchor={[6, 0, 4]} maxDist={70}>
        <StationProp
          url="/assets/models/kenney-station/computer-wide.glb"
          position={[6, 0, 4]}
          scale={2.2}
          rotation={[0, -0.6, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[-7, 0, 3]} maxDist={70}>
        <StationProp
          url="/assets/models/kenney-station/table-display.glb"
          position={[-7, 0, 3]}
          scale={2.0}
          rotation={[0, 0.8, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[9, 0, -6]} maxDist={80}>
        <StationProp
          url="/assets/models/kenney-station/container-wide.glb"
          position={[9, 0, -6]}
          scale={2.4}
          rotation={[0, 0.2, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[-10, 0, -5]} maxDist={80}>
        <StationProp
          url="/assets/models/kenney-station/container-flat.glb"
          position={[-10, 0, -5]}
          scale={2.2}
        />
      </DistanceCull>
      <DistanceCull anchor={[5, 0, -12]} maxDist={80}>
        <StationProp
          url="/assets/models/kenney-blaster/crate-wide.glb"
          position={[5, 0.35, -12]}
          scale={1.8}
        />
      </DistanceCull>
      <DistanceCull anchor={[-5, 0, -11]} maxDist={80}>
        <StationProp
          url="/assets/models/kenney-blaster/crate-medium.glb"
          position={[-5, 0.35, -11]}
          scale={1.6}
          rotation={[0, 0.4, 0]}
        />
      </DistanceCull>
      {/* Poly Haven props — real PBR set dressing */}
      <DistanceCull anchor={[4, 0, 2]} maxDist={70}>
        <StationProp
          url="/assets/models/polyhaven/plastic_crate_01/plastic_crate_01_1k.gltf"
          position={[4, 0, 2]}
          scale={1.4}
          rotation={[0, 0.35, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[-4.5, 0, -2]} maxDist={70}>
        <StationProp
          url="/assets/models/polyhaven/old_military_crate/old_military_crate_1k.gltf"
          position={[-4.5, 0, -2]}
          scale={1.15}
          rotation={[0, -0.5, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[11, 0, -14]} maxDist={85}>
        <StationProp
          url="/assets/models/polyhaven/power_box_01/power_box_01_1k.gltf"
          position={[11, 0, -14]}
          scale={1.3}
          rotation={[0, -1.2, 0]}
        />
      </DistanceCull>

      {/* Approach corridor props */}
      <DistanceCull anchor={[12, 0, -24]} maxDist={90}>
        <StationProp
          url="/assets/models/kenney-station/structure-barrier.glb"
          position={[12, 0, -24]}
          scale={2.5}
        />
      </DistanceCull>
      <DistanceCull anchor={[-12, 0, -26]} maxDist={90}>
        <StationProp
          url="/assets/models/kenney-station/structure-panel.glb"
          position={[-12, 0, -26]}
          scale={2.4}
          rotation={[0, Math.PI / 2, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[0, 0, -32]} maxDist={90}>
        <StationProp
          url="/assets/models/kenney-station/pipe.glb"
          position={[8, 2.5, -32]}
          scale={3}
          rotation={[0, 0, Math.PI / 2]}
        />
      </DistanceCull>
      <DistanceCull anchor={[-8, 0, -40]} maxDist={100}>
        <StationProp
          url="/assets/models/kenney-station/wall-window.glb"
          position={[-14, 0, -40]}
          scale={3}
          rotation={[0, Math.PI / 2, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[10, 0, -55]} maxDist={110}>
        <StationProp
          url="/assets/models/kenney-station/table-large.glb"
          position={[10, 0, -55]}
          scale={2.2}
        />
      </DistanceCull>
      <DistanceCull anchor={[-9, 0, -70]} maxDist={120}>
        <StationProp
          url="/assets/models/kenney-station/door-double.glb"
          position={[-9, 0, -70]}
          scale={2.8}
        />
      </DistanceCull>
      <DistanceCull anchor={[7, 0, -95]} maxDist={130}>
        <StationProp
          url="/assets/models/kenney-station/computer-wide.glb"
          position={[7, 0, -95]}
          scale={2.4}
          rotation={[0, -1.1, 0]}
        />
      </DistanceCull>
      <DistanceCull anchor={[0, 0, -118]} maxDist={140}>
        <StationProp
          url="/assets/models/kenney-station/structure-barrier.glb"
          position={[11, 0, -118]}
          scale={2.6}
        />
      </DistanceCull>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-station/computer-wide.glb");
useGLTF.preload("/assets/models/kenney-station/table-display.glb");
useGLTF.preload("/assets/models/kenney-station/container-wide.glb");
useGLTF.preload("/assets/models/kenney-station/structure-barrier.glb");
useGLTF.preload("/assets/models/kenney-blaster/crate-wide.glb");
useGLTF.preload(
  "/assets/models/polyhaven/plastic_crate_01/plastic_crate_01_1k.gltf",
);
useGLTF.preload(
  "/assets/models/polyhaven/old_military_crate/old_military_crate_1k.gltf",
);
useGLTF.preload("/assets/models/polyhaven/power_box_01/power_box_01_1k.gltf");

/** @deprecated alias kept for imports during transition */
export function KenneyWorldDressing() {
  return (
    <Suspense fallback={null}>
      <WorldDressing />
    </Suspense>
  );
}
