"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { playerPhysics } from "@/lib/game/playerPhysics";
import { EnergyGrid } from "@/components/game/EnergyGrid";

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
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 5) * 0.5;
  });

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      sensor
      position={position}
      onIntersectionEnter={() => {
        const body = playerPhysics.body;
        if (!body) return;
        if (performance.now() < playerPhysics.spawnGraceUntil) return;
        const p = body.translation();
        if (Math.hypot(p.x - position[0], p.z - position[2]) > 2.4) return;
        playerPhysics.applyImpulse(0, 19.5, 0, { pad: true });
        playerPhysics.punch(-0.11);
        playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.4);
        combatFx.pushBoom(
          new THREE.Vector3(position[0], position[1] + 0.4, position[2]),
          "#ff6bcb",
          3.0,
        );
        useFxStore.getState().pulseShake(0.08, 140);
      }}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        userData={{ jumpPad: true, boost: 16 }}
      >
        <cylinderGeometry args={[1.4, 1.4, 0.25, 16]} />
        <meshStandardMaterial
          color="#ff6bcb"
          emissive="#ff2ea6"
          emissiveIntensity={1.4}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.15, 3, 1, 0, (Math.PI * 2) / 3]} />
        <meshStandardMaterial
          color="#ff9ad5"
          emissive="#ff2ea6"
          emissiveIntensity={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.55, 24]} />
        <meshStandardMaterial
          color="#ff6bcb"
          emissive="#ff2ea6"
          emissiveIntensity={1.2}
          transparent
          opacity={0.55}
        />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color="#ff6bcb" intensity={1.6} distance={8} />
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
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.65);
      combatFx.pushBoom(
        new THREE.Vector3(...position),
        "#7dffef",
        4.5,
      );
      combatFx.pushBoom(
        new THREE.Vector3(position[0], position[1] - 1, position[2]),
        "#ffe066",
        2.5,
      );
      useFxStore.getState().pulseShake(0.14, 260);
      useGameStore.getState().healPlayer(30);
      useGameStore.getState().setArmor(
        Math.min(100, useGameStore.getState().armor + 20),
      );
      useGameStore.getState().setNullEnergy(100);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.85, 18, 18]} />
        <meshStandardMaterial
          color="#7dffef"
          emissive="#2ee6c8"
          emissiveIntensity={2.8}
        />
      </mesh>
      <mesh
        position={[position[0], position[1] - 0.9, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.1, 1.5, 28]} />
        <meshStandardMaterial
          color="#7dffef"
          emissive="#2ee6c8"
          emissiveIntensity={1.4}
          transparent
          opacity={0.75}
        />
      </mesh>
      <pointLight
        position={position}
        color="#7dffef"
        intensity={3.2}
        distance={18}
      />
    </group>
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
    <group>
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
      {/* Warning rim so acid reads before you step in */}
      <mesh position={[position[0], position[1] + 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(size[0], size[2]) * 0.42, Math.max(size[0], size[2]) * 0.52, 24]} />
        <meshStandardMaterial
          color="#bbf76a"
          emissive="#84cc16"
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
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

      {/* Open Drop Zone pad — keep the look-ahead lane empty */}
      <Box position={[0, 0.12, 8]} size={[14, 0.24, 14]} color="#3d4a55" />
      {/* Spawn plaza fill lights — Quake readability */}
      <pointLight position={[0, 6, 6]} intensity={2.2} color="#ffe8c8" distance={22} />
      <pointLight position={[-8, 4, 2]} intensity={1.2} color="#7dffef" distance={16} />
      <pointLight position={[8, 4, 0]} intensity={1.2} color="#7dffef" distance={16} />
      {/* Runway stripe toward the beacon so the push direction reads instantly */}
      <mesh position={[0, 0.06, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 52]} />
        <meshStandardMaterial
          color="#2ee6c8"
          emissive="#2ee6c8"
          emissiveIntensity={0.65}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Direction chevrons — Quake-readable push lane */}
      {[2, -2, -6, -10, -14, -22, -30, -36].map((z) => (
        <mesh
          key={`chev-${z}`}
          position={[0, 0.08, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.55, 0.85, 3, 1, Math.PI / 6, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#7dffef"
            emissive="#2ee6c8"
            emissiveIntensity={0.9}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {/* Flanking berms — wide of the center lane */}
      <Box position={[-12, 1.5, -2]} size={[1.5, 3, 12]} color="#5a4a3a" />
      <Box position={[12, 1.5, -6]} size={[1.5, 3, 14]} color="#4a5560" />
      {/* Approach gate with a center gap — not a solid wall in the FOV */}
      <Box position={[-8, 1.4, -18]} size={[8, 2.8, 1.4]} color="#6a5a48" />
      <Box position={[8, 1.4, -18]} size={[8, 2.8, 1.4]} color="#6a5a48" />
      <Box position={[0, 3.2, -18]} size={[6, 0.5, 1.2]} color="#4a5560" />

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

      {/* Mid-canyon combat pocket — cover flanks, open kill lane */}
      <Box position={[-7, 1.1, -40]} size={[2.2, 2.2, 2.2]} color="#5a4030" />
      <Box position={[7, 1.1, -42]} size={[2.2, 2.2, 2.2]} color="#5a4030" />
      <Box position={[-10, 0.9, -48]} size={[3, 1.8, 1.6]} color="#6b4a32" />
      <Box position={[10, 0.9, -50]} size={[3, 1.8, 1.6]} color="#6b4a32" />
      <mesh position={[0, 0.05, -46]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 14]} />
        <meshStandardMaterial
          color="#3a2a22"
          emissive="#2a1810"
          emissiveIntensity={0.25}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Mid-canyon chevrons through the combat pocket */}
      {[-40, -44, -48, -52].map((z) => (
        <mesh
          key={`midchev-${z}`}
          position={[0, 0.09, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.5, 0.75, 3, 1, Math.PI / 6, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.85}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}
      {/* Core approach chevrons — late-game lane read */}
      {[-100, -108, -116, -124].map((z) => (
        <mesh
          key={`corechev-${z}`}
          position={[0, 0.09, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.55, 0.85, 3, 1, Math.PI / 6, (Math.PI * 2) / 3]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#a78bfa"
            emissiveIntensity={1.0}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

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
      <JumpPad position={[-8, 0.2, -56]} />
      <JumpPad position={[0, 0.2, -72]} />
      <JumpPad position={[-4, 0.2, -88]} />
      <JumpPad position={[6, 0.2, -105]} />
      <JumpPad position={[-6, 0.2, -112]} />
      <JumpPad position={[0, 0.2, -126]} />
      <AcidHazard position={[-4, 0.08, -38]} size={[8, 0.1, 6]} />
      <AcidHazard position={[6, 0.08, -60]} size={[6, 0.1, 5]} />
      <AcidHazard position={[-8, 0.08, -86]} size={[5, 0.1, 4]} />
      <AcidHazard position={[7, 0.08, -110]} size={[5, 0.1, 4]} />
      <EnergyGrid position={[0, 0.06, -64]} size={[10, 3]} />
      <EnergyGrid position={[0, 0.06, -108]} size={[8, 2.5]} />
      <EnergyGrid position={[0, 0.06, -122]} size={[7, 2]} />
      <EnergyGrid position={[5, 0.06, -95]} size={[5, 2]} />      {/* Mid-canyon combat pocket cover — Quake lane readable */}
      <Box position={[-5, 1.2, -40]} size={[2.2, 2.4, 1.2]} color="#5a4030" />
      <Box position={[5, 1.2, -41]} size={[2.2, 2.4, 1.2]} color="#5a4030" />
      <Box position={[0, 0.9, -43]} size={[3.5, 1.8, 1]} color="#4a3528" />
      <Box position={[-8, 1.0, -46]} size={[2, 2, 1.2]} color="#5a4030" />
      <Box position={[8, 1.0, -47]} size={[2, 2, 1.2]} color="#5a4030" />
      {/* Core approach cover */}
      <Box position={[-6, 1.1, -114]} size={[2.4, 2.2, 1.4]} color="#2e1065" />
      <Box position={[6, 1.1, -115]} size={[2.4, 2.2, 1.4]} color="#2e1065" />
      <Box position={[0, 0.95, -120]} size={[3.2, 1.9, 1.2]} color="#312e81" />      <Suspense fallback={null}>
        <Prop
          url="/assets/models/kenney-fps/wall-high.glb"
          position={[20, 0, -8]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/wall-low.glb"
          position={[-18, 0, -12]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/platform.glb"
          position={[-14, 0.1, -4]}
          scale={2}
        />
        <Prop
          url="/assets/models/kenney-fps/platform-large-grass.glb"
          position={[0, 0.05, -70]}
          scale={3}
        />
        <Prop
          url="/assets/models/kenney-fps/enemy-flying.glb"
          position={[10, 4, -18]}
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
