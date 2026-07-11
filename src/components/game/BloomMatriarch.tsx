"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";
import { distToCam, worldPos } from "@/lib/game/math";

/** Sector 2 boss — Bloom Matriarch in the vault shaft. */
export function BloomMatriarch() {
  const bodyRef = useRef<THREE.Mesh>(null);
  const sacRefs = useRef<THREE.Mesh[]>([]);
  const hp = useRef(650);
  const dead = useRef(false);
  const phase = useRef(1);
  const cooldown = useRef(0);
  const windup = useRef(0);
  const engaged = useRef(false);

  useFrame((state, dt) => {
    const mesh = bodyRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;

    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.destructible = true;
    mesh.userData.hp = hp.current;

    const cam = state.camera.position;
    const dist = distToCam(mesh, cam);
    const wp = worldPos(mesh);
    if (wp.z > -75) return;
    if (dist < 32) engaged.current = true;

    if (engaged.current) {
      useGameStore.getState().setBoss({
        name: "Bloom Matriarch",
        hp: hp.current,
        maxHp: 650,
        phase: phase.current,
      });
    }

    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      for (const sac of sacRefs.current) if (sac) sac.visible = false;
      useGameStore.getState().clearBoss();
      useGameStore.getState().setCheckpoint({
        x: 0,
        y: 15,
        z: -95,
        label: "Vault Apex",
      });
      useGameStore
        .getState()
        .setObjective("Bloom Matriarch slain — approach the Null Core");
      playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.78);
      combatFx.pushBoom(worldPos(mesh), "#86efac", 6.2);
      combatFx.pushBoom(worldPos(mesh).clone().add(new THREE.Vector3(0, -2, 0)), "#4ade80", 3.5);
      useFxStore.getState().pulseShake(0.26, 340);
      useFxStore.getState().pulseKill("Bloom Matriarch");
      return;
    }

    if (!engaged.current) return;

    const next = hp.current > 420 ? 1 : hp.current > 200 ? 2 : 3;
    if (next !== phase.current) {
      phase.current = next;
      useGameStore
        .getState()
        .setObjective(`Bloom Matriarch — Phase ${phase.current}`);
      playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.5);
      combatFx.pushBoom(worldPos(mesh), "#ffe066", 3.2);
      useFxStore.getState().pulseShake(0.12, 200);
    }

    const t = state.clock.elapsedTime;
    mesh.position.y = 16 + Math.sin(t) * 0.6;
    mesh.rotation.y += dt * 0.5;

    sacRefs.current.forEach((sac, i) => {
      if (!sac || !sac.visible) return;
      const a = t + i * 2.1;
      sac.position.set(
        Math.cos(a) * 5,
        14 + Math.sin(a * 1.3),
        Math.sin(a) * 5,
      );
      sac.userData.destructible = true;
      if (typeof sac.userData.hp !== "number") sac.userData.hp = 35;
      if (sac.userData.hp <= 0) {
        sac.visible = false;
        hp.current -= 40;
        mesh.userData.hp = hp.current;
        combatFx.pushBoom(worldPos(sac), "#86efac", 3.4);
        combatFx.pushImpact(worldPos(sac), "#bbf7d0");
        useFxStore.getState().pulseShake(0.1, 160);
        useFxStore.getState().pulseKill("Bloom Sac");
        playSfx("/assets/audio/kenney-fps/enemy_destroy.ogg", 0.48);
      }
    });

    cooldown.current = Math.max(0, cooldown.current - dt);
    const muzzle = worldPos(mesh).clone();
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      if (Math.random() < dt * 14) {
        combatFx.pushBeam(muzzle, cam.clone(), "#fef08a", 0.07);
      }
      if (windup.current <= 0) {
        cooldown.current = phase.current === 3 ? 1.2 : 1.8;
        useGameStore.getState().damagePlayer(4 + phase.current * 2);
        if (cam.y < mesh.position.y - 2 && phase.current >= 2) {
          useGameStore.getState().damagePlayer(3);
        }
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.4);
        combatFx.pushBeam(muzzle, cam.clone(), "#86efac", 0.18);
        combatFx.pushImpact(cam.clone(), "#86efac");
        useFxStore.getState().pulseShake(0.09, 150);
      }
    } else if (dist < 28 && cooldown.current <= 0) {
      windup.current = 0.55;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.24);
      combatFx.pushImpact(muzzle, "#fef08a");
    }
  });

  return (
    <group position={[0, 0, -95]}>
      <mesh
        ref={bodyRef}
        position={[0, 16, 0]}
        castShadow
        userData={{ destructible: true, hp: 650, kind: "boss_bloom" }}
      >
        <sphereGeometry args={[2.4, 20, 20]} />
        <meshStandardMaterial
          color="#86efac"
          emissive="#166534"
          emissiveIntensity={1.1}
          roughness={0.45}
        />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) sacRefs.current[i] = el;
          }}
          userData={{ destructible: true, hp: 35, kind: "bloom_sac" }}
        >
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshStandardMaterial
            color="#bbf7d0"
            emissive="#4ade80"
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}
      {/* Climb assist pads in vault shaft */}
      <RigidBody type="fixed" colliders="cuboid" position={[-3, 5, -2]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.3, 2.5]} />
          <meshStandardMaterial color="#4ade80" emissive="#166534" emissiveIntensity={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[3, 8, 1]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.3, 2.5]} />
          <meshStandardMaterial color="#4ade80" emissive="#166534" emissiveIntensity={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-2, 11, 2]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.3, 2.5]} />
          <meshStandardMaterial color="#86efac" emissive="#166534" emissiveIntensity={1.0} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[2, 13.5, -1]}>
        <mesh castShadow>
          <boxGeometry args={[2.8, 0.3, 2.8]} />
          <meshStandardMaterial color="#bbf7d0" emissive="#15803d" emissiveIntensity={1.1} />
        </mesh>
      </RigidBody>
      <pointLight position={[0, 12, 0]} intensity={2.2} color="#86efac" distance={28} />
      <pointLight position={[0, 24, 0]} intensity={3.4} color="#fff4e0" distance={40} />
    </group>
  );
}
