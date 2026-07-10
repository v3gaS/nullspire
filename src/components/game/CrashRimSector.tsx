"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { playerPhysics } from "@/lib/game/playerPhysics";

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

function JumpPad({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      sensor
      position={position}
      onIntersectionEnter={() => {
        playerPhysics.applyImpulse(0, 16, 0, { pad: true });
        playerPhysics.punch(-0.06);
      }}
    >
      <mesh castShadow receiveShadow userData={{ jumpPad: true, boost: 14 }}>
        <cylinderGeometry args={[1.4, 1.4, 0.25, 16]} />
        <meshStandardMaterial
          color="#ff6bcb"
          emissive="#ff2ea6"
          emissiveIntensity={1.4}
          metalness={0.4}
          roughness={0.3}
        />
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

function Beacon({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const claimed = useRef(false);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || claimed.current) return;
    mesh.rotation.y += 0.02;
    const dist = state.camera.position.distanceTo(mesh.position);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const pulse = 1.8 + Math.sin(state.clock.elapsedTime * 3) * 0.7;
    mat.emissiveIntensity = dist < 8 ? pulse + 1.2 : pulse;
    mesh.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.08);
    if (dist < 3.5) {
      claimed.current = true;
      mesh.visible = false;
      useGameStore
        .getState()
        .setObjective("Beacon online — push into Rust Canyons");
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.55);
      useGameStore.getState().healPlayer(25);
      useGameStore.getState().setNullEnergy(100);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.7, 16, 16]} />
      <meshStandardMaterial
        color="#7dffef"
        emissive="#2ee6c8"
        emissiveIntensity={2.5}
      />
    </mesh>
  );
}

function AcidHazard({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const cooldown = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    cooldown.current = Math.max(0, cooldown.current - dt);
    const mesh = meshRef.current;
    if (!mesh || useGameStore.getState().screen !== "playing") return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.7 + Math.sin(state.clock.elapsedTime * 6) * 0.35;
    const cam = state.camera.position;
    const halfX = size[0] / 2;
    const halfZ = size[2] / 2;
    if (
      Math.abs(cam.x - position[0]) < halfX &&
      Math.abs(cam.z - position[2]) < halfZ &&
      cam.y < position[1] + 2.2 &&
      cooldown.current <= 0
    ) {
      cooldown.current = 0.5;
      useGameStore.getState().damagePlayer(6);
      playSfx("/assets/audio/kenney-fps/enemy_hurt.ogg", 0.18);
      mat.emissiveIntensity = 2.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size[0], size[2]]} />
      <meshStandardMaterial
        color="#7cff3a"
        emissive="#3a8a10"
        emissiveIntensity={0.8}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

/** Crash Rim + Rust Canyons approach — large footprint with jumps and hazards. */
export function CrashRimSector() {
  return (
    <group>
      {/* Ground grid accents — main floor lives in World core (never suspends) */}
      {[-40, -20, 0, 20].map((z) => (
        <mesh key={`gz-${z}`} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 0.08]} />
          <meshStandardMaterial
            color="#2ee6c8"
            emissive="#2ee6c8"
            emissiveIntensity={0.35}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
      {[-40, -20, 0, 20].map((x) => (
        <mesh key={`gx-${x}`} position={[x, 0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 120]} />
          <meshStandardMaterial
            color="#2ee6c8"
            emissive="#2ee6c8"
            emissiveIntensity={0.3}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}

      <Box position={[0, 0.15, 10]} size={[12, 0.3, 12]} color="#3d4a55" />
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

      <Beacon position={[16, 10, -20]} />

      <Box position={[6, 0.05, -8]} size={[5, 0.1, 5]} color="#1f6b4a" />
      <Box position={[-12, 0.05, -16]} size={[4, 0.1, 4]} color="#1f6b4a" />

      {/* Rust Canyons trench */}
      <Box position={[0, 1.5, -45]} size={[40, 3, 2]} color="#6b3f2a" />
      <Box position={[-18, 3, -55]} size={[4, 6, 4]} color="#5a4030" />
      <Box position={[18, 3, -55]} size={[4, 6, 4]} color="#5a4030" />
      <Box position={[-6, 1.5, -52]} size={[4, 0.4, 4]} color="#3ecfbf" />
      <Box position={[2, 3.2, -58]} size={[4, 0.4, 4]} color="#3ecfbf" />
      <Box position={[10, 4.8, -64]} size={[4, 0.4, 4]} color="#48d4c4" />
      <Box position={[0, 0.2, -70]} size={[16, 0.4, 16]} color="#3a2a22" />

      <JumpPad position={[0, 0.2, -28]} />
      <JumpPad position={[8, 0.2, -48]} />
      <AcidHazard position={[-4, 0.08, -38]} size={[8, 0.1, 6]} />

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
          url="/assets/models/kenney-fps/platform-large-grass.glb"
          position={[0, 0.05, -70]}
          scale={3}
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
useGLTF.preload("/assets/models/kenney-fps/platform-large-grass.glb");
useGLTF.preload("/assets/models/kenney-fps/enemy-flying.glb");
