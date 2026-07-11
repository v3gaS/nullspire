"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject, type RefObject } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { distToCam, worldPos } from "@/lib/game/math";
import { useFxStore } from "@/stores/fxStore";

function useDestructibleSync(
  meshRef: RefObject<THREE.Mesh | null>,
  hpRef: MutableRefObject<number>,
  deadRef: MutableRefObject<boolean>,
  boomColor = "#ff6644",
) {
  const mesh = meshRef.current;
  if (!mesh || deadRef.current) return;
  if (typeof mesh.userData.hp === "number") hpRef.current = mesh.userData.hp;
  mesh.userData.destructible = true;
  mesh.userData.hp = hpRef.current;
  if (hpRef.current <= 0) {
    deadRef.current = true;
    mesh.visible = false;
    // applyHit already gibs; add a local boom for pack readability
    combatFx.pushBoom(worldPos(mesh), boomColor, 2.2);
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
  const windup = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    useDestructibleSync(meshRef, hp, dead, "#94a3b8");
    if (dead.current) return;
    if (performance.now() < (mesh.userData.staggerUntil ?? 0)) return;

    const cam = state.camera.position;
    const wp = worldPos(mesh);
    mesh.lookAt(cam.x, wp.y, cam.z);
    cooldown.current = Math.max(0, cooldown.current - dt);
    const dist = distToCam(mesh, cam);
    const muzzle = wp.clone().add(new THREE.Vector3(0, 0.6, 0));
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 18) * 0.5;
      if (Math.random() < dt * 10) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fef08a", 0.05);
      }
      if (windup.current <= 0) {
        cooldown.current = 1.7;
        useGameStore.getState().damagePlayer(5);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.3);
        combatFx.pushBeam(muzzle, cam.clone(), "#ff6644", 0.09);
        combatFx.pushImpact(cam.clone(), "#ff6644");
        mat.emissive = new THREE.Color("#ff5533");
      }
    } else if (
      dist < 22 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      windup.current = 0.38;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.15);
    } else {
      mat.emissiveIntensity = 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 80, kind: "turret" }}
    >
      <boxGeometry args={[1.25, 1.55, 1.25]} />
      <meshStandardMaterial
        color="#9ca3af"
        metalness={0.7}
        roughness={0.32}
        emissive="#64748b"
        emissiveIntensity={0.45}
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
    useDestructibleSync(meshRef, hp, dead, "#7dff6a");
    if (dead.current) return;
    if (performance.now() < (mesh.userData.staggerUntil ?? 0)) return;

    const cam = state.camera.position;
    const to = new THREE.Vector3().subVectors(cam, mesh.position);
    const dist = to.length();
    if (dist < 22 && dist > 1.4) {
      to.y = 0;
      to.normalize();
      mesh.position.add(to.multiplyScalar(dt * 10.5));
      mesh.position.y = origin.current.y + Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.25;
      mesh.lookAt(cam.x, mesh.position.y, cam.z);
    }
    cooldown.current = Math.max(0, cooldown.current - dt);
    if (
      dist < 2.5 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      cooldown.current = 0.7;
      useGameStore.getState().damagePlayer(7);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.3);
      combatFx.pushImpact(cam.clone(), "#7dff6a");
      useFxStore.getState().pulseShake(0.04, 80);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 28, kind: "skitter" }}
    >
      <boxGeometry args={[0.85, 0.65, 1.05]} />
      <meshStandardMaterial
        color="#86efac"
        emissive="#22c55e"
        emissiveIntensity={0.8}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}

export function Spitter({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(40);
  const dead = useRef(false);
  const cooldown = useRef(0);
  const windup = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    useDestructibleSync(meshRef, hp, dead, "#a3e635");
    if (dead.current) return;
    if (performance.now() < (mesh.userData.staggerUntil ?? 0)) return;

    const cam = state.camera.position;
    mesh.lookAt(cam);
    mesh.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    cooldown.current = Math.max(0, cooldown.current - dt);
    const dist = distToCam(mesh, cam);
    const muzzle = worldPos(mesh).clone().add(new THREE.Vector3(0, 0.4, 0));
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      mat.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 20) * 0.5;
      if (Math.random() < dt * 10) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fef08a", 0.05);
      }
      if (windup.current <= 0) {
        cooldown.current = 2.2;
        useGameStore.getState().damagePlayer(5);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.3);
        combatFx.pushBeam(muzzle, cam.clone(), "#a3e635", 0.09);
        combatFx.pushImpact(cam.clone(), "#a3e635");
      }
    } else if (
      dist < 20 &&
      dist > 6 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      windup.current = 0.4;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.16);
    } else {
      mat.emissiveIntensity = 0.7;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 40, kind: "spitter" }}
    >
      <boxGeometry args={[1.15, 1.15, 1.15]} />
      <meshStandardMaterial
        color="#a3e635"
        emissive="#65a30d"
        emissiveIntensity={0.95}
        roughness={0.4}
        metalness={0.15}
      />
    </mesh>
  );
}

export function EnemyPack() {
  return (
    <group>
      {/* Drop Zone — thinned for performance */}
      <Skitter position={[5, 0.5, -2]} />
      <Skitter position={[-6, 0.5, -4]} />
      <Skitter position={[8, 0.5, -8]} />
      <Skitter position={[-9, 0.5, -9]} />
      <SentryTurret position={[10, 0.7, -14]} />
      <SentryTurret position={[-11, 0.7, -16]} />
      <Spitter position={[12, 2.0, -12]} />
      <Spitter position={[-13, 2.0, -14]} />
      <SentryTurret position={[14, 0.7, -48]} />
      <SentryTurret position={[-12, 0.7, -62]} />
      <Skitter position={[6, 0.5, -26]} />
      <Skitter position={[-7, 0.5, -28]} />
      <Skitter position={[3, 0.5, -42]} />
      <Skitter position={[0, 0.5, -66]} />
      <Skitter position={[-5, 0.5, -84]} />
      <Skitter position={[4, 0.5, -122]} />
      <Spitter position={[8, 1.8, -44]} />
      <Spitter position={[10, 2.0, -68]} />
      <Spitter position={[-8, 2.5, -90]} />
      <Spitter position={[-6, 2.0, -124]} />
      <SentryTurret position={[0, 0.7, -132]} />
    </group>
  );
}
