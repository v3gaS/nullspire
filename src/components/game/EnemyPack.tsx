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
    if (
      dist < 22 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      cooldown.current = 1.8;
      useGameStore.getState().damagePlayer(5);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.28);
      combatFx.pushBeam(wp.clone().add(new THREE.Vector3(0, 0.6, 0)), cam.clone(), "#ff6644", 0.07);
      combatFx.pushImpact(cam.clone(), "#ff6644");
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
      <SentryTurret position={[20, 0.7, -28]} />
      <SentryTurret position={[-18, 0.7, -24]} />
      <SentryTurret position={[14, 0.7, -48]} />
      <SentryTurret position={[-12, 0.7, -62]} />
      <SentryTurret position={[8, 0.7, -82]} />
      <SentryTurret position={[-10, 0.7, -100]} />
      <Skitter position={[6, 0.5, -26]} />
      <Skitter position={[-7, 0.5, -28]} />
      <Skitter position={[12, 0.5, -36]} />
      <Skitter position={[-4, 0.5, -38]} />
      <Skitter position={[3, 0.5, -42]} />
      <Skitter position={[-8, 0.5, -46]} />
      <Skitter position={[5, 0.5, -50]} />
      <Skitter position={[0, 0.5, -66]} />
      <Skitter position={[-5, 0.5, -84]} />
      <Skitter position={[7, 0.5, -102]} />
      <Skitter position={[-3, 0.5, -114]} />
      <Skitter position={[4, 0.5, -122]} />
      <Skitter position={[2, 0.5, -56]} />
      <Skitter position={[-6, 0.5, -76]} />
      <Skitter position={[9, 0.5, -96]} />      <Spitter position={[18, 2.5, -30]} />
      <Spitter position={[-12, 1.5, -34]} />
      <Spitter position={[8, 1.8, -44]} />
      <Spitter position={[-14, 2.2, -52]} />
      <Spitter position={[10, 2.0, -68]} />
      <Spitter position={[-8, 2.5, -90]} />
      <Spitter position={[12, 2.2, -112]} />
      <Spitter position={[-6, 2.0, -124]} />
      <SentryTurret position={[16, 0.7, -108]} />
      <SentryTurret position={[-14, 0.7, -116]} />
    </group>
  );
}
