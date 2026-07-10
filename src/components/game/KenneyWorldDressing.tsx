"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";

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

function GlbDressing() {
  return (
    <group>
      {/* Flanking cover — keep center lane clear for shots toward drones */}
      <GlbProp
        url="/assets/models/kenney-fps/wall-high.glb"
        position={[6.5, 0, 4]}
        scale={3.5}
        rotation={[0, -0.5, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/wall-high.glb"
        position={[-6.5, 0, 3]}
        scale={3.5}
        rotation={[0, 0.7, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/wall-low.glb"
        position={[-4, 0, 5]}
        scale={3}
        rotation={[0, 0.4, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/platform.glb"
        position={[-3, 0.02, 6]}
        scale={3}
      />
      <GlbProp
        url="/assets/models/kenney-fps/platform.glb"
        position={[5, 0.02, -2]}
        scale={3}
      />
      <GlbProp
        url="/assets/models/kenney-fps/platform-large-grass.glb"
        position={[-12, 0.02, -4]}
        scale={3.2}
      />
      <GlbProp
        url="/assets/models/kenney-fps/blaster.glb"
        position={[-2, 1.2, 5]}
        scale={5}
        rotation={[0.2, 1.2, 0.3]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/blaster-repeater.glb"
        position={[2.5, 1.2, 4.5]}
        scale={5}
        rotation={[0, -0.8, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/enemy-flying.glb"
        position={[3, 2.8, 0]}
        scale={2.5}
        rotation={[0, Math.PI, 0]}
      />
      <GlbProp
        url="/assets/models/kenney-fps/enemy-flying.glb"
        position={[-8, 3.2, -8]}
        scale={2.5}
      />
      <GlbProp
        url="/assets/models/kenney-fps/cloud.glb"
        position={[8, 12, -20]}
        scale={5}
      />
      <GlbProp
        url="/assets/models/kenney-fps/grass.glb"
        position={[1, 0, 7]}
        scale={2.5}
      />
      <GlbProp
        url="/assets/models/kenney-fps/grass-small.glb"
        position={[-1.5, 0, 7.5]}
        scale={2.5}
      />
    </group>
  );
}

function ObjDressing() {
  return (
    <group>
      <ObjProp
        url="/assets/models/kenney-space/barrelLarge.obj"
        position={[3.5, 0, 6.5]}
        scale={2}
        color="#94a3b8"
      />
      <ObjProp
        url="/assets/models/kenney-space/barrel.obj"
        position={[5, 0, 6.8]}
        scale={2}
        color="#a8a29e"
      />
      <ObjProp
        url="/assets/models/kenney-space/console.obj"
        position={[-5, 0, 5]}
        scale={2}
        rotation={[0, 0.9, 0]}
        color="#64748b"
      />
      <ObjProp
        url="/assets/models/kenney-space/metalFence.obj"
        position={[1, 0, 3.5]}
        scale={2}
        color="#cbd5e1"
      />
      <ObjProp
        url="/assets/models/kenney-space/robot.obj"
        position={[-3, 0, 3]}
        scale={2.2}
        color="#38bdf8"
      />
      <ObjProp
        url="/assets/models/kenney-space/alien.obj"
        position={[6, 0, -2]}
        scale={2.5}
        rotation={[0, -1, 0]}
        color="#86efac"
      />
      <ObjProp
        url="/assets/models/kenney-space/satelliteDish.obj"
        position={[12, 0, -10]}
        scale={1.8}
        color="#e2e8f0"
      />
      <ObjProp
        url="/assets/models/kenney-space/spaceCraft1.obj"
        position={[-18, 1, 4]}
        scale={1.2}
        rotation={[0, 0.5, 0]}
        color="#94a3b8"
      />
      <ObjProp
        url="/assets/models/kenney-space/rocksTall.obj"
        position={[-10, 0, -6]}
        scale={2}
        color="#78716c"
      />
      <ObjProp
        url="/assets/models/kenney-space/stairs.obj"
        position={[8, 0, -8]}
        scale={2}
        color="#a8a29e"
      />
      <RigidBody type="fixed" colliders="cuboid" position={[3.5, 0.8, 6.5]}>
        <mesh visible={false}>
          <boxGeometry args={[1.4, 1.6, 1.4]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

/** Dense Kenney kitbash — GLBs and OBJs in separate Suspense so one failure cannot blank both. */
export function KenneyWorldDressing() {
  return (
    <group>
      <Suspense fallback={null}>
        <GlbDressing />
      </Suspense>
      <Suspense fallback={null}>
        <ObjDressing />
      </Suspense>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/wall-high.glb");
useGLTF.preload("/assets/models/kenney-fps/wall-low.glb");
useGLTF.preload("/assets/models/kenney-fps/platform.glb");
useGLTF.preload("/assets/models/kenney-fps/platform-large-grass.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster.glb");
useGLTF.preload("/assets/models/kenney-fps/blaster-repeater.glb");
useGLTF.preload("/assets/models/kenney-fps/enemy-flying.glb");
useGLTF.preload("/assets/models/kenney-fps/cloud.glb");
useGLTF.preload("/assets/models/kenney-fps/grass.glb");
useGLTF.preload("/assets/models/kenney-fps/grass-small.glb");
