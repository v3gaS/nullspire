"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { distToCam, worldPos } from "@/lib/game/math";

function useDestructibleSync(
  meshRef: RefObject<THREE.Mesh | null>,
  hpRef: MutableRefObject<number>,
  deadRef: MutableRefObject<boolean>,
) {
  const mesh = meshRef.current;
  if (!mesh || deadRef.current) return;
  if (typeof mesh.userData.hp === "number") hpRef.current = mesh.userData.hp;
  mesh.userData.destructible = true;
  mesh.userData.hp = hpRef.current;
  if (hpRef.current <= 0) {
    deadRef.current = true;
    mesh.visible = false;
  }
}

export function SentryTurret({
  position,
}: {
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(80);
  const dead = useRef(false);
  const cooldown = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    useDestructibleSync(meshRef, hp, dead);
    if (dead.current) return;

    const cam = state.camera.position;
    const wp = worldPos(mesh);
    mesh.lookAt(cam.x, wp.y, cam.z);
    cooldown.current = Math.max(0, cooldown.current - dt);
    const dist = distToCam(mesh, cam);
    if (dist < 22 && cooldown.current <= 0) {
      cooldown.current = 1.8;
      useGameStore.getState().damagePlayer(5);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.28);
      (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(
        "#ff5533",
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 80, kind: "turret" }}
    >
      <cylinderGeometry args={[0.55, 0.8, 1.4, 8]} />
      <meshStandardMaterial
        color="#8a93a0"
        metalness={0.75}
        roughness={0.3}
        emissive="#223"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export function Skitter({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(28);
  const dead = useRef(false);
  const cooldown = useRef(0);
  const origin = useRef(new THREE.Vector3(...position));

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    useDestructibleSync(meshRef, hp, dead);
    if (dead.current) return;

    const cam = state.camera.position;
    const to = new THREE.Vector3().subVectors(cam, mesh.position);
    const dist = to.length();
    if (dist < 22 && dist > 1.4) {
      to.y = 0;
      to.normalize();
      mesh.position.add(to.multiplyScalar(dt * 5.5));
      mesh.position.y = origin.current.y + Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.25;
      mesh.lookAt(cam.x, mesh.position.y, cam.z);
    }
    cooldown.current = Math.max(0, cooldown.current - dt);
    if (dist < 2.0 && cooldown.current <= 0) {
      cooldown.current = 1.0;
      useGameStore.getState().damagePlayer(7);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.3);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 28, kind: "skitter" }}
    >
      <coneGeometry args={[0.45, 0.9, 5]} />
      <meshStandardMaterial
        color="#7dff6a"
        emissive="#1a5a12"
        emissiveIntensity={0.5}
        roughness={0.55}
      />
    </mesh>
  );
}

export function Spitter({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(40);
  const dead = useRef(false);
  const cooldown = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    useDestructibleSync(meshRef, hp, dead);
    if (dead.current) return;

    const cam = state.camera.position;
    mesh.lookAt(cam);
    mesh.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    cooldown.current = Math.max(0, cooldown.current - dt);
    const dist = distToCam(mesh, cam);
    if (dist < 20 && dist > 6 && cooldown.current <= 0) {
      cooldown.current = 2.4;
      useGameStore.getState().damagePlayer(5);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.26);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 40, kind: "spitter" }}
    >
      <sphereGeometry args={[0.65, 12, 12]} />
      <meshStandardMaterial
        color="#c4ff4a"
        emissive="#5a7a10"
        emissiveIntensity={0.7}
        roughness={0.4}
      />
    </mesh>
  );
}

export function EnemyPack() {
  return (
    <group>
      <SentryTurret position={[18, 0.7, -18]} />
      <SentryTurret position={[-16, 0.7, -8]} />
      <Skitter position={[2, 0.5, -10]} />
      <Skitter position={[-3, 0.5, -14]} />
      <Skitter position={[8, 0.5, -22]} />
      <Spitter position={[18, 2.5, -12]} />
      <Spitter position={[-10, 1.5, -24]} />
    </group>
  );
}
