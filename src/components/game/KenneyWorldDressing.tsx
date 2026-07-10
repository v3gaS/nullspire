"use client";

import { Suspense, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
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
  const texAlien = useTexture("/assets/textures/kenney-space/alien.png");
  const cloned = useMemo(() => {
    const c = obj.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = new THREE.MeshStandardMaterial({
          color,
          map: url.includes("alien") ? texAlien : null,
          roughness: 0.65,
          metalness: 0.35,
        });
      }
    });
    return c;
  }, [obj, color, url, texAlien]);
  return (
    <primitive
      object={cloned}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

/** Dense Kenney kitbash so free assets are clearly visible in-play. */
export function KenneyWorldDressing() {
  return (
    <Suspense fallback={null}>
      <group>
        {/* FPS kit walls / platforms — large and obvious near spawn */}
        <GlbProp
          url="/assets/models/kenney-fps/wall-high.glb"
          position={[6, 0, 6]}
          scale={2.5}
          rotation={[0, -0.4, 0]}
        />
        <GlbProp
          url="/assets/models/kenney-fps/wall-high.glb"
          position={[-10, 0, 2]}
          scale={2.5}
          rotation={[0, 0.6, 0]}
        />
        <GlbProp
          url="/assets/models/kenney-fps/wall-low.glb"
          position={[2, 0, 2]}
          scale={2.2}
        />
        <GlbProp
          url="/assets/models/kenney-fps/platform.glb"
          position={[-5, 0.05, 8]}
          scale={2.5}
        />
        <GlbProp
          url="/assets/models/kenney-fps/platform.glb"
          position={[8, 0.05, -6]}
          scale={2.5}
        />
        <GlbProp
          url="/assets/models/kenney-fps/platform-large-grass.glb"
          position={[-16, 0.02, -6]}
          scale={2.8}
        />
        <GlbProp
          url="/assets/models/kenney-fps/blaster.glb"
          position={[-3.5, 1.5, -5.5]}
          scale={3}
          rotation={[0, 0.8, 0.2]}
        />
        <GlbProp
          url="/assets/models/kenney-fps/blaster-repeater.glb"
          position={[-6.5, 2.9, -9.5]}
          scale={3}
          rotation={[0, -0.5, 0]}
        />
        <GlbProp
          url="/assets/models/kenney-fps/enemy-flying.glb"
          position={[5, 2.5, -3]}
          scale={2}
          rotation={[0, Math.PI * 0.7, 0]}
        />
        <GlbProp
          url="/assets/models/kenney-fps/enemy-flying.glb"
          position={[-12, 3, -20]}
          scale={2.2}
        />
        <GlbProp
          url="/assets/models/kenney-fps/cloud.glb"
          position={[10, 14, -30]}
          scale={4}
        />
        <GlbProp
          url="/assets/models/kenney-fps/cloud.glb"
          position={[-20, 16, -50]}
          scale={5}
        />
        <GlbProp
          url="/assets/models/kenney-fps/grass.glb"
          position={[3, 0, 9]}
          scale={2}
        />
        <GlbProp
          url="/assets/models/kenney-fps/grass-small.glb"
          position={[-2, 0, 11]}
          scale={2}
        />

        {/* Space kit OBJ props */}
        <ObjProp
          url="/assets/models/kenney-space/barrelLarge.obj"
          position={[3, 0, 7]}
          scale={1.2}
          color="#6b7280"
        />
        <ObjProp
          url="/assets/models/kenney-space/barrel.obj"
          position={[4.2, 0, 7.4]}
          scale={1.2}
          color="#78716c"
        />
        <ObjProp
          url="/assets/models/kenney-space/console.obj"
          position={[-6, 0, 5]}
          scale={1.4}
          rotation={[0, 0.9, 0]}
          color="#475569"
        />
        <ObjProp
          url="/assets/models/kenney-space/metalFence.obj"
          position={[0, 0, 4]}
          scale={1.5}
          color="#94a3b8"
        />
        <ObjProp
          url="/assets/models/kenney-space/metalStructure.obj"
          position={[14, 0, -8]}
          scale={1.3}
          color="#64748b"
        />
        <ObjProp
          url="/assets/models/kenney-space/rocksTall.obj"
          position={[-18, 0, -14]}
          scale={1.5}
          color="#57534e"
        />
        <ObjProp
          url="/assets/models/kenney-space/rocks.obj"
          position={[12, 0, 2]}
          scale={1.4}
          color="#57534e"
        />
        <ObjProp
          url="/assets/models/kenney-space/satelliteDish.obj"
          position={[18, 0, -18]}
          scale={1.2}
          color="#94a3b8"
        />
        <ObjProp
          url="/assets/models/kenney-space/alien.obj"
          position={[7, 0, -10]}
          scale={1.8}
          rotation={[0, -1, 0]}
          color="#86efac"
        />
        <ObjProp
          url="/assets/models/kenney-space/robot.obj"
          position={[-4, 0, -2]}
          scale={1.5}
          color="#38bdf8"
        />
        <ObjProp
          url="/assets/models/kenney-space/spaceCraft1.obj"
          position={[-25, 0.5, 5]}
          scale={0.9}
          rotation={[0, 0.4, 0]}
          color="#64748b"
        />
        <ObjProp
          url="/assets/models/kenney-space/crater.obj"
          position={[20, 0, -40]}
          scale={2}
          color="#44403c"
        />
        <ObjProp
          url="/assets/models/kenney-space/stairs.obj"
          position={[10, 0, -16]}
          scale={1.4}
          color="#78716c"
        />

        {/* Colliders under a few key props so they feel solid */}
        <RigidBody type="fixed" colliders="cuboid" position={[3, 0.6, 7]}>
          <mesh visible={false}>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[-6, 0.7, 5]}>
          <mesh visible={false}>
            <boxGeometry args={[1.5, 1.4, 1.2]} />
          </mesh>
        </RigidBody>
      </group>
    </Suspense>
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
