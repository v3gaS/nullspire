"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { DistanceCull } from "./DistanceCull";

function GlbProp({
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
        if (m.material) {
          const mat = Array.isArray(m.material)
            ? m.material[0]
            : m.material;
          if (mat && "emissiveIntensity" in mat) {
            const std = mat as THREE.MeshStandardMaterial;
            std.emissiveIntensity = Math.max(std.emissiveIntensity, 0.15);
          }
        }
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

function ObjProp({
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0] as [number, number, number],
  color = "#8b9bb4",
}: {
  url: string;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  color?: string;
}) {
  const obj = useLoader(OBJLoader, url);
  const cloned = useMemo(() => {
    const c = obj.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.userData.skipHit = true;
        m.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          metalness: 0.4,
          emissive: new THREE.Color(color).multiplyScalar(0.15),
        });
      }
    });
    return c;
  }, [obj, color]);
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
 * Drop Zone must read as an open plaza: clear |x|<9, z in [0..14].
 * Dressing frames the lane toward the beacon (-Z), not the player's face.
 */
function GlbDressing() {
  return (
    <group>
      {/* Far flanking ruins — outside spawn FOV */}
      <GlbProp
        url="/assets/models/kenney-fps/wall-high.glb"
        position={[14, 0, -6]}
        scale={3.2}
        rotation={[0, -0.35, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/wall-high.glb"
        position={[-14, 0, -8]}
        scale={3.2}
        rotation={[0, 0.4, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/wall-low.glb"
        position={[12, 0, -16]}
        scale={2.8}
        rotation={[0, 0.2, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/wall-low.glb"
        position={[-12, 0, -14]}
        scale={2.8}
        rotation={[0, -0.25, 0]}
      />

      {/* Mid-lane platforms — ahead, not underfoot */}
      <GlbProp
        url="/assets/models/kenney-fps/platform.glb"
        position={[-10, 0.02, -12]}
        scale={2.6}
      />
      <GlbProp
        url="/assets/models/kenney-fps/platform.glb"
        position={[11, 0.02, -18]}
        scale={2.6}
      />
      <GlbProp
        url="/assets/models/kenney-fps/platform-large-grass.glb"
        position={[-16, 0.02, -22]}
        scale={2.8}
      />

      {/* Scenic props — high / far */}
      <GlbProp
        url="/assets/models/kenney-fps/enemy-flying.glb"
        position={[10, 4.5, -14]}
        scale={2}
        rotation={[0, Math.PI * 0.7, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/enemy-flying.glb"
        position={[-11, 5, -20]}
        scale={2}
      />
      <GlbProp
        url="/assets/models/kenney-fps/cloud.glb"
        position={[6, 14, -28]}
        scale={4.5}
      />

      {/* Tiny ground accents at plaza edge only */}
      <GlbProp
        url="/assets/models/kenney-fps/grass-small.glb"
        position={[7.5, 0, 2]}
        scale={1.8}
      />
      <GlbProp
        url="/assets/models/kenney-fps/grass-small.glb"
        position={[-7.5, 0, 1]}
        scale={1.8}
      />
    </group>
  );
}

function ObjDressing() {
  return (
    <group>
      {/* Clean hard-surface props only — soft Kenney blobs stay off the approach cone */}
      <ObjProp
        url="/assets/models/kenney-space/barrelLarge.obj"
        position={[11, 0, -8]}
        scale={1.6}
        color="#94a3b8"
      />
      <ObjProp
        url="/assets/models/kenney-space/barrel.obj"
        position={[12.2, 0, -9.5]}
        scale={1.6}
        color="#a8a29e"
      />
      <ObjProp
        url="/assets/models/kenney-space/console.obj"
        position={[-12, 0, -10]}
        scale={1.6}
        rotation={[0, 0.9, 0]}
        color="#64748b"
      />
      <ObjProp
        url="/assets/models/kenney-space/metalFence.obj"
        position={[14, 0, -16]}
        scale={1.6}
        color="#cbd5e1"
      />
      <ObjProp
        url="/assets/models/kenney-space/satelliteDish.obj"
        position={[20, 0, -32]}
        scale={1.5}
        color="#e2e8f0"
      />
      <ObjProp
        url="/assets/models/kenney-space/stairs.obj"
        position={[-16, 0, -24]}
        scale={1.6}
        color="#a8a29e"
      />
      <RigidBody type="fixed" colliders="cuboid" position={[11, 0.65, -8]}>
        <mesh visible={false}>
          <boxGeometry args={[1.1, 1.3, 1.1]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

/** Readable Drop Zone plaza — props frame the push toward the beacon. */
export function KenneyWorldDressing() {
  return (
    <DistanceCull anchor={[0, 0, -8]} maxDist={70}>
      <group>
        <Suspense fallback={null}>
          <GlbDressing />
        </Suspense>
        <Suspense fallback={null}>
          <ObjDressing />
        </Suspense>
      </group>
    </DistanceCull>
  );
}

useGLTF.preload("/assets/models/kenney-fps/wall-high.glb");
useGLTF.preload("/assets/models/kenney-fps/wall-low.glb");
useGLTF.preload("/assets/models/kenney-fps/platform.glb");
useGLTF.preload("/assets/models/kenney-fps/platform-large-grass.glb");
useGLTF.preload("/assets/models/kenney-fps/enemy-flying.glb");
useGLTF.preload("/assets/models/kenney-fps/cloud.glb");
useGLTF.preload("/assets/models/kenney-fps/grass-small.glb");
