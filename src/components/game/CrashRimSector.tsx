"use client";

import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Suspense } from "react";

function Box({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.2} />
      </mesh>
    </RigidBody>
  );
}

function Prop({
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
  const cloned = scene.clone(true);
  return (
    <primitive
      object={cloned}
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}

/** Crash Rim starter sector — large footprint with jumps and cover. */
export function CrashRimSector() {
  return (
    <group>
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[120, 1, 120]} />
          <meshStandardMaterial color="#2a2438" roughness={1} />
        </mesh>
      </RigidBody>

      <Box position={[0, 0.15, 10]} size={[12, 0.3, 12]} color="#3d3554" />
      <Box position={[-8, 1.5, 0]} size={[1.5, 3, 10]} color="#5a4a3a" />
      <Box position={[10, 1.5, -4]} size={[1.5, 3, 14]} color="#4a5560" />
      <Box position={[0, 1.2, -18]} size={[20, 2.4, 1.5]} color="#6a5a48" />

      <Box position={[-4, 1.2, -6]} size={[3, 0.4, 3]} color="#3ecfbf" />
      <Box position={[-7, 2.6, -10]} size={[3, 0.4, 3]} color="#3ecfbf" />
      <Box position={[-3, 4, -14]} size={[3, 0.4, 3]} color="#3ecfbf" />
      <Box position={[2, 5.2, -16]} size={[4, 0.4, 3]} color="#48d4c4" />

      <Box position={[16, 4, -20]} size={[6, 8, 6]} color="#3a4550" />
      <Box position={[16, 8.5, -20]} size={[4, 1, 4]} color="#2ee6c8" />

      {[-30, -20, -10, 0, 10, 20].map((z) => (
        <Box key={z} position={[-22, 2, z]} size={[2, 4, 2]} color="#554838" />
      ))}

      <mesh position={[16, 10, -20]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#7dffef"
          emissive="#2ee6c8"
          emissiveIntensity={2}
        />
      </mesh>

      <Box position={[6, 0.05, -8]} size={[5, 0.1, 5]} color="#1f6b4a" />
      <Box position={[-12, 0.05, -16]} size={[4, 0.1, 4]} color="#1f6b4a" />

      <Suspense fallback={null}>
        <Prop
          url="/assets/models/kenney-fps/wall-high.glb"
          position={[22, 0, 4]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/wall-low.glb"
          position={[4, 0, -2]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/platform.glb"
          position={[-14, 0.1, 4]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/enemy-flying.glb"
          position={[8, 3, -12]}
          scale={1.5}
          rotation={[0, Math.PI, 0]}
        />
      </Suspense>
    </group>
  );
}

useGLTF.preload("/assets/models/kenney-fps/wall-high.glb");
useGLTF.preload("/assets/models/kenney-fps/wall-low.glb");
useGLTF.preload("/assets/models/kenney-fps/platform.glb");
useGLTF.preload("/assets/models/kenney-fps/enemy-flying.glb");
