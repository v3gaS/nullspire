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
      if (Math.random() < dt * 9) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fef08a", 0.05);
      }
      if (windup.current <= 0) {
        cooldown.current = 1.8;
        useGameStore.getState().damagePlayer(7);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.36);
        combatFx.pushBeam(muzzle, cam.clone(), "#94a3b8", 0.12);
        combatFx.pushImpact(cam.clone(), "#94a3b8");
      }
    } else if (
      dist < 24 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      windup.current = 0.45;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.18);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        userData={{ destructible: true, hp: 200, kind: "bastion" }}
      >
        <boxGeometry args={[1.6, 2.2, 1.6]} />
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
      return;
    }

    const cam = state.camera.position;
    blink.current -= dt;
    const cloaked = Math.sin(state.clock.elapsedTime * 3) > 0.35;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = cloaked ? 0.15 : 0.85;
    mat.transparent = true;

    if (blink.current <= 0 && distToCam(mesh, cam) < 22) {
      blink.current = 2.4;
      const dir = new THREE.Vector3()
        .subVectors(cam, worldPos(mesh))
        .normalize();
      mesh.position.add(dir.multiplyScalar(6));
      playSfx("/assets/audio/kenney-fps/jump_a.ogg", 0.2);
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
      <octahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial
        color="#a78bfa"
        emissive="#4c1d95"
        emissiveIntensity={0.9}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

export function LootDrop({
  position,
  kind,
}: {
  position: [number, number, number];
  kind: "health" | "ammo" | "shards";
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const taken = useRef(false);
  const color =
    kind === "health" ? "#ff6b7a" : kind === "ammo" ? "#fbbf24" : "#5dffd7";

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
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.35);
      combatFx.pushImpact(mesh.position.clone(), color);
      useFxStore.getState().pulseShake(0.04, 80);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
        />
      </mesh>
      <pointLight
        position={position}
        color={color}
        intensity={1.1}
        distance={5}
      />
    </group>
  );
}

export function EliteAndLoot() {
  return (
    <group>
      <BastionUnit position={[20, 1.1, -50]} />
      <NullStalker position={[-8, 1, -42]} />
      <NullStalker position={[6, 1, -62]} />
      <LootDrop position={[8, 0.6, -14]} kind="health" />
      <LootDrop position={[-9, 1.6, -12]} kind="ammo" />
      <LootDrop position={[14, 0.6, -22]} kind="shards" />
      <LootDrop position={[0, 0.8, -68]} kind="health" />
    </group>
  );
}
