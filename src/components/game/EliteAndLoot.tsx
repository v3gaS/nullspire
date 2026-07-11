"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { distToCam, worldPos } from "@/lib/game/math";

export function BastionUnit({
  position,
}: {
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const hp = useRef(140);
  const shield = useRef(60);
  const dead = useRef(false);
  const cooldown = useRef(0);
  const windup = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") {
      const reported = mesh.userData.hp as number;
      if (reported < hp.current + shield.current) {
        const lost = hp.current + shield.current - reported;
        let remain = lost;
        const absorb = Math.min(shield.current, remain);
        shield.current -= absorb;
        remain -= absorb;
        hp.current -= remain;
        mesh.userData.hp = hp.current + shield.current;
      }
    }
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current + shield.current;

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      if (shieldRef.current) shieldRef.current.visible = false;
      combatFx.pushBoom(worldPos(mesh), "#94a3b8", 4.6);
      combatFx.pushBoom(
        worldPos(mesh).clone().add(new THREE.Vector3(0, 0.5, 0)),
        "#ffb347",
        2.0,
      );
      combatFx.pushImpact(worldPos(mesh), "#cbd5e1");
      useFxStore.getState().pulseKill("Bastion");
      useFxStore.getState().pulseShake(0.15, 220);
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.68);
      return;
    }

    if (shieldRef.current) {
      shieldRef.current.visible = shield.current > 0;
      shieldRef.current.rotation.y += dt;
    }

    const cam = state.camera.position;
    const wp = worldPos(mesh);
    mesh.lookAt(cam.x, wp.y, cam.z);
    cooldown.current = Math.max(0, cooldown.current - dt);
    const dist = distToCam(mesh, cam);
    const muzzle = wp.clone().add(new THREE.Vector3(0, 0.8, 0));
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      if (Math.random() < dt * 12) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fef08a", 0.07);
      }
      if (windup.current <= 0) {
        cooldown.current = 1.8;
        useGameStore.getState().damagePlayer(7);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.4);
        combatFx.pushBeam(muzzle, cam.clone(), "#94a3b8", 0.14);
        combatFx.pushImpact(cam.clone(), "#94a3b8");
        useFxStore.getState().pulseShake(0.06, 100);
      }
    } else if (
      dist < 24 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      windup.current = 0.5;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.2);
      combatFx.pushImpact(muzzle, "#fef08a");
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        userData={{ destructible: true, hp: 200, kind: "bastion" }}
      >
        <boxGeometry args={[1.85, 2.4, 1.85]} />
        <meshStandardMaterial
          color="#4b5563"
          metalness={0.8}
          roughness={0.25}
          emissive="#1e293b"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={shieldRef} scale={1.35}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.25}
          emissive="#0ea5e9"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export function NullStalker({
  position,
}: {
  position: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(55);
  const dead = useRef(false);
  const cooldown = useRef(0);
  const blink = useRef(0);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;
    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      combatFx.pushBoom(worldPos(mesh), "#a78bfa", 3.8);
      combatFx.pushBoom(
        worldPos(mesh).clone().add(new THREE.Vector3(0, 0.4, 0)),
        "#ff7a18",
        1.6,
      );
      combatFx.pushImpact(worldPos(mesh), "#c4b5fd");
      useFxStore.getState().pulseKill("Stalker");
      useFxStore.getState().pulseShake(0.13, 190);
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.55);
      return;
    }

    const cam = state.camera.position;
    blink.current -= dt;
    const cloaked = Math.sin(state.clock.elapsedTime * 3) > 0.35;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = cloaked ? 0.15 : 0.85;
    mat.transparent = true;

    // Blink telegraph — brighten before teleport
    if (blink.current < 0.35 && blink.current > 0 && distToCam(mesh, cam) < 22) {
      mat.emissiveIntensity = 2.2;
      mat.opacity = 0.95;
    }

    if (blink.current <= 0 && distToCam(mesh, cam) < 22) {
      blink.current = 2.4;
      const from = worldPos(mesh).clone();
      const dir = new THREE.Vector3()
        .subVectors(cam, from)
        .normalize();
      mesh.position.add(dir.multiplyScalar(6));
      combatFx.pushImpact(from, "#c4b5fd");
      combatFx.pushImpact(worldPos(mesh), "#a78bfa");
      combatFx.pushBeam(from, worldPos(mesh), "#fef08a", 0.1);
      combatFx.pushBoom(from, "#a78bfa", 1.8);
      combatFx.pushBoom(worldPos(mesh), "#ff7a18", 1.0);
      playSfx("/assets/audio/kenney-fps/jump_a.ogg", 0.34);
      useFxStore.getState().pulseShake(0.055, 100);
      mat.emissiveIntensity = 0.9;
    }

    cooldown.current = Math.max(0, cooldown.current - dt);
    if (
      distToCam(mesh, cam) < 2.4 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      cooldown.current = 0.85;
      useGameStore.getState().damagePlayer(16);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.35);
      combatFx.pushImpact(cam.clone(), "#a78bfa");
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 55, kind: "stalker" }}
    >
      <boxGeometry args={[1.05, 1.7, 0.85]} />
      <meshStandardMaterial
        color="#c4b5fd"
        emissive="#7c3aed"
        emissiveIntensity={1.0}
        transparent
        opacity={0.82}
        metalness={0.35}
        roughness={0.35}
      />
    </mesh>
  );
}

export function LootDrop({
  position,
  kind,
}: {
  position: [number, number, number];
  kind: "health" | "ammo" | "shards" | "armor";
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const taken = useRef(false);
  const color =
    kind === "health"
      ? "#4ade80"
      : kind === "ammo"
        ? "#fbbf24"
        : kind === "armor"
          ? "#a78bfa"
          : "#5dffd7";

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh || taken.current) return;
    mesh.rotation.y += 0.03;
    mesh.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.12;
    if (state.camera.position.distanceTo(mesh.position) < 1.6) {
      taken.current = true;
      mesh.visible = false;
      const s = useGameStore.getState();
      switch (kind) {
        case "health":
          s.healPlayer(30);
          break;
        case "armor":
          s.setArmor(Math.min(100, s.armor + 25));
          break;
        case "ammo": {
          const w = s.weapons[s.activeWeapon];
          useGameStore.setState({
            weapons: {
              ...s.weapons,
              [s.activeWeapon]: { ...w, reserve: w.reserve + 24 },
            },
          });
          break;
        }
        case "shards":
          s.setNullEnergy(Math.min(100, s.nullEnergy + 25));
          break;
        default: {
          const _exhaustive: never = kind;
          return _exhaustive;
        }
      }
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.48);
      combatFx.pushImpact(mesh.position.clone(), color);
      combatFx.pushBoom(mesh.position.clone(), color, 1.9);
      combatFx.pushBoom(
        mesh.position.clone().add(new THREE.Vector3(0, 0.2, 0)),
        "#ffffff",
        0.8,
      );
      useFxStore.getState().pulseShake(0.07, 120);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position} castShadow>
        <boxGeometry args={[0.74, 0.74, 0.74]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.9}
          metalness={0.15}
          roughness={0.22}
          toneMapped={false}
        />
      </mesh>
      <mesh position={position}>
        <boxGeometry args={[0.98, 0.98, 0.98]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[position[0], 0.05, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.55, 0.85, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.85}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={position}
        color={color}
        intensity={0.9}
        distance={6}
      />
    </group>
  );
}

export function EliteAndLoot() {
  return (
    <group>
      <BastionUnit position={[20, 1.1, -50]} />
      <BastionUnit position={[-16, 1.1, -66]} />
      <BastionUnit position={[8, 1.1, -128]} />
      <NullStalker position={[-8, 1, -42]} />
      <NullStalker position={[6, 1, -62]} />
      <NullStalker position={[8, 1, -126]} />
      <LootDrop position={[8, 0.6, -14]} kind="health" />
      <LootDrop position={[-9, 1.6, -12]} kind="ammo" />
      <LootDrop position={[-3.5, 0.7, 5.5]} kind="health" />
      <LootDrop position={[4.2, 0.7, 4.8]} kind="ammo" />
      <LootDrop position={[-5.5, 0.7, 3.2]} kind="armor" />
      <LootDrop position={[0, 0.8, -68]} kind="health" />
      <LootDrop position={[-7, 0.8, -46]} kind="ammo" />
      <LootDrop position={[4, 0.8, -78]} kind="health" />
      <LootDrop position={[0, 0.8, -116]} kind="health" />
      <LootDrop position={[-5, 0.8, -122]} kind="ammo" />
      <LootDrop position={[0, 0.8, -50]} kind="health" />
      <LootDrop position={[2, 0.8, -15]} kind="armor" />
    </group>
  );
}
