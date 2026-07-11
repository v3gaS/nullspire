"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "@/stores/gameStore";
import { useFxStore } from "@/stores/fxStore";
import { playSfx } from "@/lib/game/audio";
import { combatFx } from "@/components/game/CombatVfx";

interface DroneProps {
  position: [number, number, number];
  id: string;
}

/** Simple aggro drone — orbits then fires damage pulses at the player. */
export function DroneScout({ position, id }: DroneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hp = useRef(50);
  const cooldown = useRef(0);
  const windup = useRef(0);
  const origin = useRef(new THREE.Vector3(...position));
  const dead = useRef(false);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    if (!mesh || dead.current) return;
    if (useGameStore.getState().screen !== "playing") return;
    if (performance.now() < (mesh.userData.staggerUntil ?? 0)) return;

    const t = state.clock.elapsedTime;
    const cam = state.camera.position;
    const dist = cam.distanceTo(mesh.position);

    mesh.position.x = origin.current.x + Math.sin(t + id.length) * 2.5;
    mesh.position.y = origin.current.y + Math.sin(t * 1.4) * 0.4;
    mesh.position.z = origin.current.z + Math.cos(t * 0.7 + id.length) * 2.5;
    mesh.lookAt(cam);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    cooldown.current = Math.max(0, cooldown.current - dt);
    if (windup.current > 0) {
      windup.current = Math.max(0, windup.current - dt);
      mat.emissiveIntensity = 1.6 + Math.sin(t * 22) * 0.5;
      if (Math.random() < dt * 8) {
        combatFx.pushBeam(mesh.position.clone(), cam.clone(), "#fde68a", 0.04);
      }
      if (windup.current <= 0) {
        cooldown.current = 2.4;
        useGameStore.getState().damagePlayer(4);
        playSfx("/assets/audio/kenney-fps/enemy_attack.ogg", 0.28);
        combatFx.pushBeam(mesh.position.clone(), cam.clone(), "#ff8866", 0.08);
        combatFx.pushImpact(cam.clone(), "#ff8866");
        mat.emissive = new THREE.Color("#ff3344");
      }
    } else if (
      dist < 14 &&
      cooldown.current <= 0 &&
      performance.now() >= useGameStore.getState().invulnerableUntil
    ) {
      windup.current = 0.4;
      playSfx("/assets/audio/kenney-fps/weapon_change.ogg", 0.15);
    } else {
      mat.emissiveIntensity = 0.6;
    }

    mesh.userData.destructible = true;
    if (typeof mesh.userData.hp === "number") hp.current = mesh.userData.hp;
    mesh.userData.hp = hp.current;
    if (hp.current <= 0) {
      dead.current = true;
      mesh.visible = false;
      combatFx.pushBoom(mesh.position.clone(), "#6ecbff", 3.4);
      combatFx.pushBoom(
        mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)),
        "#bae6fd",
        1.6,
      );
      combatFx.pushImpact(mesh.position.clone(), "#bae6fd");
      useFxStore.getState().pulseKill("Drone");
      useFxStore.getState().pulseShake(0.1, 160);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      userData={{ destructible: true, hp: 50, kind: "drone", id }}
    >
      <boxGeometry args={[1.25, 0.8, 1.25]} />
      <meshStandardMaterial
        color="#94a3b8"
        emissive="#38bdf8"
        emissiveIntensity={0.9}
        metalness={0.65}
        roughness={0.3}
      />
    </mesh>
  );
}

export function DroneSquad() {
  return (
    <group>
      <DroneScout id="d0a" position={[7, 3.2, -8]} />
      <DroneScout id="d0b" position={[-8, 3.4, -10]} />
      <DroneScout id="d0c" position={[11, 3.0, -5]} />
      <DroneScout id="d0d" position={[-12, 3.2, -6]} />
      <DroneScout id="d1" position={[12, 3.5, -26]} />
      <DroneScout id="d2" position={[18, 4, -34]} />
      <DroneScout id="d3" position={[-14, 3.8, -44]} />
      <DroneScout id="d4" position={[8, 4.2, -54]} />
      <DroneScout id="d5" position={[-6, 4.5, -72]} />
      <DroneScout id="d6" position={[14, 5, -100]} />
      <DroneScout id="d7" position={[-12, 5.5, -120]} />
      <DroneScout id="d8" position={[4, 4.0, -40]} />
      <DroneScout id="d9" position={[-10, 4.8, -88]} />
      <DroneScout id="d10" position={[10, 5.2, -114]} />
      <DroneScout id="d11" position={[-4, 4.5, -58]} />
      <DroneScout id="d12" position={[6, 5.0, -130]} />
      <DroneScout id="d13" position={[9, 3.8, -18]} />
      <DroneScout id="d14" position={[-9, 4.0, -20]} />
    </group>
  );
}
